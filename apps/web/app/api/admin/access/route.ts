import { NextRequest, NextResponse } from 'next/server';
import { PinAuthService } from '@/lib/auth/pin-service';

export async function GET(req: NextRequest) {
  try {
    const credentials = await PinAuthService.listCredentials();
    return NextResponse.json({ success: true, credentials });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list credentials' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, email, qualification, designation, currentAdminPassword } = body;

    if (!name || !role) {
      return NextResponse.json(
        { success: false, error: 'Name and role are required.' },
        { status: 400 }
      );
    }

    if (!['doctor', 'officer', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be doctor, officer, or admin.' },
        { status: 400 }
      );
    }

    // Creating an admin requires confirming the current administrator code
    if (role === 'admin') {
      if (!currentAdminPassword) {
        return NextResponse.json(
          { success: false, error: 'Current administrator code is required to authorize creating a new admin.' },
          { status: 400 }
        );
      }
      const verification = await PinAuthService.verifyPin('admin', currentAdminPassword, '127.0.0.1');
      if (!verification.success) {
        return NextResponse.json(
          { success: false, error: 'Incorrect administrator verification code.' },
          { status: 403 }
        );
      }
    }

    const created = await PinAuthService.createCredential(name, role, {
      email,
      qualification,
      designation,
    });
    return NextResponse.json({ success: true, credential: created });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create credential' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, isActive, oldPin, newPin } = body;

    if (action === 'regenerate') {
      if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
      const result = await PinAuthService.regeneratePin(id);
      return NextResponse.json({ success: true, pin: result.pin });
    }

    if (action === 'toggle') {
      if (!id || typeof isActive !== 'boolean') {
        return NextResponse.json({ success: false, error: 'ID and isActive boolean required' }, { status: 400 });
      }
      await PinAuthService.toggleActive(id, isActive);
      return NextResponse.json({ success: true });
    }

    if (action === 'change_admin_code') {
      if (!oldPin || !newPin) {
        return NextResponse.json({ success: false, error: 'Both current and new PIN are required' }, { status: 400 });
      }
      await PinAuthService.changeAdminCode(oldPin, newPin);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to execute credential action' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Credential ID is required' }, { status: 400 });
    }

    await PinAuthService.deleteCredential(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete credential' },
      { status: 500 }
    );
  }
}

