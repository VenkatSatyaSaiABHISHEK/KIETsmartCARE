import { NextRequest, NextResponse } from 'next/server';
import { PinAuthService, UserRole } from '@/lib/auth/pin-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, pin } = body;

    if (!role || !pin) {
      return NextResponse.json(
        { success: false, error: 'Both role and PIN are required.' },
        { status: 400 }
      );
    }

    if (!['doctor', 'officer', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified.' },
        { status: 400 }
      );
    }

    const expectedLength = role === 'admin' ? 8 : 5;
    if (pin.length !== expectedLength || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: `PIN must be exactly ${expectedLength} numeric digits.` },
        { status: 400 }
      );
    }

    // Determine client IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

    const result = await PinAuthService.verifyPin(role as UserRole, pin, ip);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          lockedOut: result.lockedOut || false,
          remainingAttempts: result.remainingAttempts,
          remainingMinutes: result.remainingMinutes,
        },
        { status: result.lockedOut ? 429 : 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      redirectUrl: `/${role}`,
      user: result.user,
    });

    // Set secure, httpOnly session cookies
    if (result.token) {
      response.cookies.set('kiet_session', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60, // 24 hours
      });

      response.cookies.set('kiet_user_role', role, {
        httpOnly: false, // accessible to client for fast UI role awareness
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Authentication error occurred.' },
      { status: 500 }
    );
  }
}

