import { NextResponse } from 'next/server';
import {
  getAllKeys,
  createKey,
  addDaysToKey,
  resetKeyHwid,
  updateKeyStatus,
  regenerateApiKey,
  deleteKey,
  validateIntegratedPipeline
} from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || searchParams.get('key');
    const username = searchParams.get('username') || searchParams.get('user');
    const hwid = searchParams.get('hwid') || searchParams.get('deviceId');

    if (token || username) {
      const result = validateIntegratedPipeline({ userToken: token, username, hwid });
      const statusCode = result.success ? 200 : 401;
      return NextResponse.json(result, { status: statusCode });
    }

    // Tarik semua data API
    const rawTokens = getAllKeys();
    const formattedData = rawTokens.map((item) => ({
      user: item.username,
      username: item.username,
      token: item.token || item.key,
      dayExpired: item.dayExpired || item.expiresAt,
      daysRemaining: item.daysRemaining,
      status: item.status,
      alias: item.alias || '',
      maxDevices: item.maxDevices !== undefined ? item.maxDevices : 1,
      boundDevices: item.boundDevices || [],
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
    const maxDevices = body.maxDevices !== undefined ? body.maxDevices : (searchParams.get('maxDevices') || 1);
    const hwid = body.hwid || body.deviceId || searchParams.get('hwid');

    if (body.action === 'validate' || (!username && body.token)) {
      const token = body.token || body.key;
      const result = validateIntegratedPipeline({ userToken: token, hwid });
      const statusCode = result.success ? 200 : 401;
      return NextResponse.json(result, { status: statusCode });
    }

    if (!username || username.trim() === '') {
      return NextResponse.json(
        { status: 'FAILED', success: false, message: 'Username / Nama User wajib diisi' },
        { status: 400 }
      );
    }

    const record = createKey({ username, alias, durationDays, maxDevices });

    return NextResponse.json({
      status: 'SUCCESS',
      success: true,
      message: 'User & Token berhasil dibuat',
      user: record.user,
      token: record.token,
      dayExpired: record.dayExpired,
      daysRemaining: record.daysRemaining,
      maxDevices: record.maxDevices,
      boundDevices: record.boundDevices
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'FAILED', success: false, message: err.message },
      { status: 500 }
    );
  }
}

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

    if (action === 'reset_hwid' || action === 'reset_device') {
      const updated = resetKeyHwid(targetToken);
      return NextResponse.json({
        status: 'SUCCESS',
        success: true,
        message: 'Perangkat (HWID/Device) terikat berhasil di-reset!',
        user: updated.user,
        token: updated.token,
        boundDevices: updated.boundDevices
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
