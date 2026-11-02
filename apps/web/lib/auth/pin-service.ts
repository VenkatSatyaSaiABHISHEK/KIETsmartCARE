import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '../supabase/admin';

export type UserRole = 'doctor' | 'officer' | 'admin';

export interface PinCredential {
  id: string;
  name: string;
  role: UserRole;
  pin_length: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface SessionPayload {
  id: string;
  name: string;
  role: UserRole;
  qualification?: string;
  designation?: string;
  email?: string;
  iat: number;
  exp: number;
}

const SESSION_SECRET = process.env.PIN_SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || 'kiet-smart-care-production-pin-secret-key-32chars!';
const LOCKOUT_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

// Emergency fallback only for Master Administrator if database is temporarily unreachable
const MASTER_ADMIN_FALLBACK = {
  name: 'Master Administrator',
  pinHash: '$2b$10$btORtiHoQd93x5Hoe5RwJ.CKWODh./OR5k6mhqOHtrr1MXEkEbStO', // 31012005
  length: 8,
};

// In-memory rate limiting store as high-speed buffer & offline fallback
interface RateLimitRecord {
  failedAttempts: number;
  lockedUntil: number | null;
  history: number[];
}
const rateLimitStore = new Map<string, RateLimitRecord>();

function getRateLimitKey(ip: string, role: string): string {
  return `${ip}:${role}`;
}

function isConfiguredSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    url.length > 0 &&
    !url.includes('your-project.supabase.co') &&
    key.length > 0 &&
    !key.includes('your-anon-key') &&
    !key.includes('your-service-role')
  );
}

export class PinAuthService {
  /**
   * Cryptographically signs session token
   */
  static createSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 24 * 60 * 60; // 24 hours
    const fullPayload: SessionPayload = { ...payload, iat, exp };
    
    const dataStr = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(dataStr)
      .digest('base64url');
    
    return `${dataStr}.${signature}`;
  }

  /**
   * Verifies session token
   */
  static verifySessionToken(token: string): SessionPayload | null {
    try {
      const [dataStr, signature] = token.split('.');
      if (!dataStr || !signature) return null;

      const expectedSig = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(dataStr)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return null;
      }

      const payload: SessionPayload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) return null;

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Checks rate limit for given IP and Role
   */
  static async checkRateLimit(ip: string, role: UserRole): Promise<{ isLocked: boolean; remainingMinutes: number; remainingAttempts: number }> {
    const key = getRateLimitKey(ip, role);
    const now = Date.now();
    const fifteenMinutesAgo = now - LOCKOUT_MINUTES * 60 * 1000;

    let record = rateLimitStore.get(key);
    if (!record) {
      record = { failedAttempts: 0, lockedUntil: null, history: [] };
      rateLimitStore.set(key, record);
    }

    // Clear old attempts outside window
    record.history = record.history.filter((t) => t > fifteenMinutesAgo);
    record.failedAttempts = record.history.length;

    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      return { isLocked: true, remainingMinutes, remainingAttempts: 0 };
    } else if (record.lockedUntil && record.lockedUntil <= now) {
      record.lockedUntil = null;
      record.failedAttempts = 0;
      record.history = [];
    }

    // Also query Supabase if available
    if (isConfiguredSupabase()) {
      try {
        const supabase = createAdminClient();
        const cutoff = new Date(fifteenMinutesAgo).toISOString();
        const { data: attempts } = await supabase
          .from('login_attempts')
          .select('id, attempted_at, success')
          .eq('ip_address', ip)
          .eq('role', role)
          .gte('attempted_at', cutoff)
          .order('attempted_at', { ascending: false });

        if (attempts && attempts.length > 0) {
          const consecutiveFails: any[] = [];
          for (const a of attempts) {
            if (a.success) break;
            consecutiveFails.push(a);
          }

          if (consecutiveFails.length >= MAX_FAILED_ATTEMPTS) {
            const lastFailTime = new Date(consecutiveFails[0].attempted_at).getTime();
            const lockExpiresAt = lastFailTime + LOCKOUT_MINUTES * 60 * 1000;
            if (lockExpiresAt > now) {
              const remainingMinutes = Math.ceil((lockExpiresAt - now) / 60000);
              record.lockedUntil = lockExpiresAt;
              return { isLocked: true, remainingMinutes, remainingAttempts: 0 };
            }
          }
          record.failedAttempts = Math.max(record.failedAttempts, consecutiveFails.length);
        }
      } catch {
        // In-memory rate limiting applies
      }
    }

    const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - record.failedAttempts);
    return { isLocked: false, remainingMinutes: 0, remainingAttempts };
  }

  /**
   * Logs a login attempt to memory and Supabase audit
   */
  static async logAttempt(ip: string, role: UserRole, success: boolean): Promise<void> {
    const key = getRateLimitKey(ip, role);
    const now = Date.now();
    let record = rateLimitStore.get(key);
    if (!record) {
      record = { failedAttempts: 0, lockedUntil: null, history: [] };
      rateLimitStore.set(key, record);
    }

    if (success) {
      record.failedAttempts = 0;
      record.lockedUntil = null;
      record.history = [];
    } else {
      record.history.push(now);
      record.failedAttempts = record.history.length;
      if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        record.lockedUntil = now + LOCKOUT_MINUTES * 60 * 1000;
      }
    }

    if (isConfiguredSupabase()) {
      try {
        const supabase = createAdminClient();
        await supabase.from('login_attempts').insert({
          ip_address: ip,
          role,
          success,
          attempted_at: new Date().toISOString(),
        });
      } catch {
        // Ignore database insert failure in offline mode
      }
    }
  }

  /**
   * Verifies PIN against active role credentials
   */
  static async verifyPin(
    role: UserRole,
    pin: string,
    ipAddress: string
  ): Promise<{
    success: boolean;
    error?: string;
    lockedOut?: boolean;
    remainingMinutes?: number;
    remainingAttempts?: number;
    token?: string;
    user?: { id: string; name: string; role: UserRole };
  }> {
    // 1. Check rate limit
    const rateCheck = await this.checkRateLimit(ipAddress, role);
    if (rateCheck.isLocked) {
      return {
        success: false,
        lockedOut: true,
        remainingMinutes: rateCheck.remainingMinutes,
        error: `Too many failed attempts. Locked out for ${rateCheck.remainingMinutes} more minute${rateCheck.remainingMinutes === 1 ? '' : 's'}.`,
      };
    }

    // 2. Fetch active credentials for role
    let activeCredentials: Array<{ id: string; name: string; role: UserRole; pin_hash: string }> = [];

    if (isConfiguredSupabase()) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from('access_credentials')
          .select('id, name, role, pin_hash')
          .eq('role', role)
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          activeCredentials = data;
        }
      } catch {
        // Use fallback seed
      }
    }

    // If no credentials found in DB, only allow Master Admin emergency fallback
    if (activeCredentials.length === 0) {
      if (role === 'admin') {
        activeCredentials.push({
          id: 'seed-admin',
          name: MASTER_ADMIN_FALLBACK.name,
          role: 'admin',
          pin_hash: MASTER_ADMIN_FALLBACK.pinHash,
        });
      } else {
        return {
          success: false,
          error: `No active ${role} accounts provisioned yet. Please contact the administrator.`,
        };
      }
    }

    // 3. Constant-time / bcrypt match against all active credentials for that role
    let matchedUser: { id: string; name: string; role: UserRole } | null = null;

    for (const cred of activeCredentials) {
      try {
        const isMatch = bcrypt.compareSync(pin, cred.pin_hash);
        if (isMatch) {
          let resolvedId = cred.id;
          try {
            const supabase = createAdminClient();
            const { data: prof } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', cred.id)
              .maybeSingle();

            if (!prof) {
              const { data: roleProf } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', cred.role)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();
              if (roleProf) resolvedId = roleProf.id;
            }
          } catch {}

          matchedUser = {
            id: resolvedId,
            name: cred.name,
            role: cred.role,
          };
          break;
        }
      } catch {
        // Continue checking
      }
    }

    if (matchedUser) {
      await this.logAttempt(ipAddress, role, true);

      // Update last_login_at in background
      try {
        if (!matchedUser.id.startsWith('seed-')) {
          const supabase = createAdminClient();
          await supabase
            .from('access_credentials')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', matchedUser.id);
        }
      } catch {
        // Ignore
      }

      const token = this.createSessionToken({
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role,
      });

      return {
        success: true,
        token,
        user: matchedUser,
      };
    } else {
      await this.logAttempt(ipAddress, role, false);
      const postCheck = await this.checkRateLimit(ipAddress, role);
      if (postCheck.isLocked) {
        return {
          success: false,
          lockedOut: true,
          remainingMinutes: postCheck.remainingMinutes,
          error: `Too many failed attempts. Locked out for ${postCheck.remainingMinutes} minutes.`,
        };
      }

      return {
        success: false,
        remainingAttempts: postCheck.remainingAttempts,
        error: `Incorrect PIN. ${postCheck.remainingAttempts} attempt${postCheck.remainingAttempts === 1 ? '' : 's'} remaining before 15-min lockout.`,
      };
    }
  }

  /**
   * Generates a unique 5-digit PIN for Doctor / Officer
   */
  static async generateUniqueFiveDigitPin(role: 'doctor' | 'officer'): Promise<string> {
    let pin = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      attempts++;
      // Random 5-digit number (10000 - 99999)
      const num = crypto.randomInt(10000, 100000);
      pin = num.toString();

      if (!isConfiguredSupabase()) {
        isUnique = true;
        break;
      }

      try {
        const supabase = createAdminClient();
        const { data } = await supabase
          .from('access_credentials')
          .select('id, pin_hash')
          .eq('role', role)
          .eq('is_active', true);

        if (!data || data.length === 0) {
          isUnique = true;
          break;
        }

        // Verify none of the active credentials match this candidate PIN
        let collision = false;
        for (const item of data) {
          if (bcrypt.compareSync(pin, item.pin_hash)) {
            collision = true;
            break;
          }
        }
        if (!collision) isUnique = true;
      } catch {
        isUnique = true;
      }
    }

    return pin;
  }

  /**
   * Create a new PIN credential (admin only)
   */
  static async createCredential(
    name: string,
    role: UserRole,
    options?: {
      email?: string;
      qualification?: string;
      designation?: string;
    }
  ): Promise<{ id: string; name: string; role: UserRole; pin: string }> {
    const pin =
      role === 'admin'
        ? crypto.randomInt(10000000, 100000000).toString()
        : await this.generateUniqueFiveDigitPin(role);
    const pinHash = bcrypt.hashSync(pin, 10);
    const pinLength = role === 'admin' ? 8 : 5;

    const supabase = createAdminClient();

    // 1. Generate unique email for auth user
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').slice(0, 20);
    const randomSuffix = crypto.randomBytes(2).toString('hex');
    const authEmail = options?.email || `${slug}.${randomSuffix}@kiet.edu`;

    let userId: string = crypto.randomUUID();

    // 2. Create in auth.users if Supabase admin is available
    try {
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: authEmail,
        email_confirm: true,
        user_metadata: { role, full_name: name.trim() },
      });
      if (!authErr && authUser?.user?.id) {
        userId = authUser.user.id;
      }
    } catch {
      // Continue with random UUID if auth schema is bypassed
    }

    // 3. Upsert into profiles table
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        role,
        full_name: name.trim(),
        status: 'active',
      });
    } catch {
      // Ignore if profiles upsert fails
    }

    // 4. Insert into access_credentials
    const insertPayload: any = {
      id: userId,
      name: name.trim(),
      role,
      pin_hash: pinHash,
      pin_length: pinLength,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('access_credentials')
      .insert(insertPayload)
      .select('id, name, role')
      .single();

    if (error) {
      throw new Error(`Failed to create access credential: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      role: data.role as UserRole,
      pin,
    };
  }

  /**
   * Regenerates a PIN for an existing credential
   */
  static async regeneratePin(credentialId: string): Promise<{ pin: string }> {
    const supabase = createAdminClient();
    const { data: cred, error: fetchErr } = await supabase
      .from('access_credentials')
      .select('id, role')
      .eq('id', credentialId)
      .single();

    if (fetchErr || !cred) {
      throw new Error('Credential not found');
    }

    const pin =
      cred.role === 'admin'
        ? crypto.randomInt(10000000, 100000000).toString()
        : await this.generateUniqueFiveDigitPin(cred.role);

    const pinHash = bcrypt.hashSync(pin, 10);

    const { error: updateErr } = await supabase
      .from('access_credentials')
      .update({
        pin_hash: pinHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', credentialId);

    if (updateErr) {
      throw new Error(`Failed to update credential PIN: ${updateErr.message}`);
    }

    return { pin };
  }

  /**
   * Toggles credential active state
   */
  static async toggleActive(credentialId: string, isActive: boolean): Promise<void> {
    const supabase = createAdminClient();

    // Check if disabling an admin
    if (!isActive) {
      const { data: target } = await supabase
        .from('access_credentials')
        .select('id, role')
        .eq('id', credentialId)
        .maybeSingle();

      if (target?.role === 'admin') {
        const { count } = await supabase
          .from('access_credentials')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin')
          .eq('is_active', true);

        if ((count ?? 0) <= 1) {
          throw new Error('Action blocked: The last active administrator account cannot be disabled, deleted, or demoted.');
        }
      }
    }

    const { error } = await supabase
      .from('access_credentials')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', credentialId);

    // Also update profiles table
    try {
      await supabase
        .from('profiles')
        .update({
          status: isActive ? 'active' : 'disabled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', credentialId);
    } catch {
      // Ignore
    }

    if (error) {
      throw new Error(`Failed to toggle credential status: ${error.message}`);
    }
  }

  /**
   * Deletes a credential (soft-delete, protects last active admin)
   */
  static async deleteCredential(credentialId: string): Promise<void> {
    const supabase = createAdminClient();

    // Check if deleting an admin
    const { data: target } = await supabase
      .from('access_credentials')
      .select('id, role')
      .eq('id', credentialId)
      .maybeSingle();

    if (target?.role === 'admin') {
      const { count } = await supabase
        .from('access_credentials')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('is_active', true);

      if ((count ?? 0) <= 1) {
        throw new Error('Action blocked: The last active administrator account cannot be disabled, deleted, or demoted.');
      }
    }

    // Soft-delete in access_credentials: mark inactive and updated
    const { error } = await supabase
      .from('access_credentials')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', credentialId);

    // Soft-delete in profiles: set status = 'deleted'
    try {
      await supabase
        .from('profiles')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', credentialId);
    } catch {
      // Ignore
    }

    // Ban user in auth.users so any existing sessions are revoked
    try {
      await supabase.auth.admin.updateUserById(credentialId, {
        ban_duration: '876000h',
      });
    } catch {
      // Ignore
    }

    if (error) {
      throw new Error(`Failed to delete credential: ${error.message}`);
    }
  }

  /**
   * Changes Admin 8-digit code
   */
  static async changeAdminCode(oldPin: string, newPin: string): Promise<void> {
    if (!/^\d{8}$/.test(newPin)) {
      throw new Error('New Admin code must be exactly 8 digits.');
    }

    const supabase = createAdminClient();
    const { data: admins } = await supabase
      .from('access_credentials')
      .select('id, pin_hash')
      .eq('role', 'admin')
      .eq('is_active', true);

    let currentAdmin = admins && admins.length > 0 ? admins[0] : null;

    if (currentAdmin) {
      const match = bcrypt.compareSync(oldPin, currentAdmin.pin_hash);
      if (!match) {
        throw new Error('Current Admin code is incorrect.');
      }
      const newHash = bcrypt.hashSync(newPin, 10);
      await supabase
        .from('access_credentials')
        .update({
          pin_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentAdmin.id);
    } else {
      // Create admin credential
      const newHash = bcrypt.hashSync(newPin, 10);
      await supabase.from('access_credentials').insert({
        name: 'Master Administrator',
        role: 'admin',
        pin_hash: newHash,
        pin_length: 8,
        is_active: true,
      });
    }
  }

  /**
   * Lists all credentials (never returns hash)
   */
  static async listCredentials(): Promise<PinCredential[]> {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('access_credentials')
        .select('id, name, role, pin_length, is_active, created_at, updated_at, last_login_at')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [
          {
            id: 'seed-admin',
            name: 'Master Administrator',
            role: 'admin',
            pin_length: 8,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'seed-doctor',
            name: 'Dr. Alok Verma (OPD Clinic)',
            role: 'doctor',
            pin_length: 5,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'seed-officer',
            name: 'Health Officer Sharma',
            role: 'officer',
            pin_length: 5,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }

      return data;
    } catch {
      return [];
    }
  }
}
