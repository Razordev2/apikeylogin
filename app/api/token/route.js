import { NextResponse } from 'next/server';
import {
  getAllKeys,
  createKey,
  addDaysToKey,
  updateKeyStatus,
  regenerateApiKey,
  deleteKey,
  validateIntegratedPipeline
} from '@/lib/db';

// GET /api/token?token=YOUR_TOKEN or GET /api/token (list all if admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || searchParams.get('key');
    const username = searchParams.get('username') || searchParams.get('user');

    if (token || username) {
      const result = validateIntegratedPipeline({ userToken: token, username });
      const statusCode = result.success ? 200 : 401;
      return NextResponse.json(result, { status: statusCode });
    }

    // List all tokens
    const tokens = getAllKeys();
    return NextResponse.json({
      success: true,
      data: tokens
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, status: 'FAILED', message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/token -> Create User + Token + Day Expired (For .EXE / Remote Panels)
export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body fallback
    }

    const { searchParams } = new URL(request.url);
    const username = body.username || body.user || searchParams.get('username');
    const alias = body.alias || body.note || searchParams.get('alias');
    const durationDays = body.durationDays || body.days || searchParams.get('durationDays') || 30;

    // If request contains token to validate instead of creating
    if (body.action === 'validate' || (!username && body.token)) {
      const token = body.token || body.key;
      const result = validateIntegratedPipeline({ userToken: token });
      const statusCode = result.success ? 200 : 401;
      return NextResponse.json(result, { status: statusCode });
    }

    if (!username || username.trim() === '') {
      return NextResponse.json(
        { success: false, status: 'FAILED', message: 'Username / Nama User wajib diisi' },
        { status: 400 }
      );
    }

    const record = createKey({ username, alias, durationDays });

    return NextResponse.json({
      status: 'SUCCESS',
      success: true,
      message: 'User & Token berhasil dibuat',
      user: record.user,
      token: record.token,
      dayExpired: record.dayExpired,
      daysRemaining: record.daysRemaining
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, status: 'FAILED', message: err.message },
      { status: 500 }
    );
  }
}

// PUT /api/token -> Tambah Hari (Add Days) or Toggle Status
export async function PUT(request) {
  try {
    const body = await request.json();
    const { token, id, action, days, status } = body;
    const targetToken = token || id;

    if (!targetToken) {
      return NextResponse.json(
        { success: false, status: 'FAILED', message: 'Token wajib diisi' },
        { status: 400 }
      );
    }

    if (action === 'add_days' || days) {
      const updated = addDaysToKey(targetToken, days || 30);
      return NextResponse.json({
        status: 'SUCCESS',
        success: true,
        message: `Berhasil menambahkan +${days || 30} hari pada token!`,
        user: updated.user,
        token: updated.token,
        dayExpired: updated.dayExpired,
        daysRemaining: updated.daysRemaining,
        tambahanDay: updated.tambahanDay
      });
    }

    if (action === 'toggle_status') {
      const updated = updateKeyStatus(targetToken, status);
      return NextResponse.json({
        status: 'SUCCESS',
        success: true,
        message: `Status token diubah menjadi ${status}`,
        user: updated.user,
        token: updated.token,
        dayExpired: updated.dayExpired
      });
    }

    if (action === 'regenerate') {
      const updated = regenerateApiKey(targetToken);
      return NextResponse.json({
        status: 'SUCCESS',
        success: true,
        message: 'Token baru berhasil di-generate',
        user: updated.user,
        token: updated.token,
        dayExpired: updated.dayExpired
      });
    }

    return NextResponse.json(
      { success: false, status: 'FAILED', message: 'Action tidak dikenal' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, status: 'FAILED', message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/token?token=YOUR_TOKEN
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || searchParams.get('id');

    if (!token) {
      return NextResponse.json(
        { success: false, status: 'FAILED', message: 'Token wajib diisi' },
        { status: 400 }
      );
    }

    deleteKey(token);

    return NextResponse.json({
      status: 'SUCCESS',
      success: true,
      message: 'Token berhasil dihapus'
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, status: 'FAILED', message: err.message },
      { status: 500 }
    );
  }
}
