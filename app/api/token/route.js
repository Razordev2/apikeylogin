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

// GET /api/token -> Tarik semua data API (user, token, dayExpired, daysRemaining, status)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || searchParams.get('key');
    const username = searchParams.get('username') || searchParams.get('user');

    // Jika dipanggil dengan spesifik ?token=... atau ?username=...
    if (token || username) {
      const result = validateIntegratedPipeline({ userToken: token, username });
      const statusCode = result.success ? 200 : 401;
      return NextResponse.json(result, { status: statusCode });
    }

    // Tarik semua data API (list semua user + token)
    const rawTokens = getAllKeys();
    const formattedData = rawTokens.map((item) => ({
      user: item.username,
      username: item.username,
      token: item.token || item.key,
      dayExpired: item.dayExpired || item.expiresAt,
      daysRemaining: item.daysRemaining,
      status: item.status,
      alias: item.alias || '',
      createdAt: item.createdAt
    }));

    return NextResponse.json({
      status: 'SUCCESS',
      success: true,
      total: formattedData.length,
      data: formattedData
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'FAILED', success: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/token -> Create User + Token + Day Expired
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

    if (body.action === 'validate' || (!username && body.token)) {
      const token = body.token || body.key;
      const result = validateIntegratedPipeline({ userToken: token });
      const statusCode = result.success ? 200 : 401;
      return NextResponse.json(result, { status: statusCode });
    }

    if (!username || username.trim() === '') {
      return NextResponse.json(
        { status: 'FAILED', success: false, message: 'Username / Nama User wajib diisi' },
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
      { status: 'FAILED', success: false, message: err.message },
      { status: 500 }
    );
  }
}

// PUT /api/token -> Tambah Hari (Add Days)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { token, id, action, days } = body;
    const targetToken = token || id;

    if (!targetToken) {
      return NextResponse.json(
        { status: 'FAILED', success: false, message: 'Token wajib diisi' },
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
      const updated = updateKeyStatus(targetToken, body.status);
      return NextResponse.json({
        status: 'SUCCESS',
        success: true,
        message: `Status token diubah menjadi ${body.status}`,
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
      { status: 'FAILED', success: false, message: 'Action tidak dikenal' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { status: 'FAILED', success: false, message: err.message },
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
        { status: 'FAILED', success: false, message: 'Token wajib diisi' },
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
      { status: 'FAILED', success: false, message: err.message },
      { status: 500 }
    );
  }
}
