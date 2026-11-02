export type UserRole = 'doctor' | 'officer' | 'admin';

export interface EdgeSessionPayload {
  id: string;
  name: string;
  role: UserRole;
  qualification?: string;
  designation?: string;
  email?: string;
  iat: number;
  exp: number;
}

const DEFAULT_SECRET = 'kiet-production-pin-session-signing-secret-key-32chars!';

/**
 * Edge-compatible session token validator using Web Crypto API
 */
export async function verifyEdgeSessionToken(
  token: string,
  secretStr?: string
): Promise<EdgeSessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [dataStr, signatureStr] = parts;
    const secret = secretStr || process.env.PIN_SESSION_SECRET || DEFAULT_SECRET;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode base64url signature to Uint8Array
    const base64 = signatureStr.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(dataStr)
    );

    if (!isValid) return null;

    // Decode payload
    const payloadBase64 = dataStr.replace(/-/g, '+').replace(/_/g, '/');
    const payloadPadded = payloadBase64.padEnd(payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4), '=');
    const payloadJson = atob(payloadPadded);
    const payload: EdgeSessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}
