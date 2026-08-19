import { NextResponse } from 'next/server';
import {
  getAllKeys,
  createKey,
  addDaysToKey,
  updateKeyStatus,
  regenerateApiKey,
  deleteKey
} from '@/lib/db';

export async function GET() {
  try {
    const keys = getAllKeys();

    const stats = {
      total: keys.length,
      active: keys.filter((k) => k.status === 'active').length,
      expired: keys.filter((k) => k.status === 'expired').length,
      revoked: keys.filter((k) => k.status === 'revoked').length
    };

    return NextResponse.json({
      success: true,
      stats,
      data: keys
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, alias, durationDays } = body;

    if (!username || username.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Nama User / Username wajib diisi' },
        { status: 400 }
      );
    }

    const record = createKey({ username, alias, durationDays });

    return NextResponse.json({
      success: true,
      message: 'User & Token berhasil dibuat',
      user: record.user,
      token: record.token,
      dayExpired: record.dayExpired,
      daysRemaining: record.daysRemaining,
      data: record
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, token, action, days, status } = body;
    const targetId = id || token;

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: 'ID atau Token wajib disertakan' },
        { status: 400 }
      );
    }

    if (action === 'add_days') {
      const updated = addDaysToKey(targetId, days);
      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan +${days} hari pada token!`,
        user: updated.user,
        token: updated.token,
        dayExpired: updated.dayExpired,
        daysRemaining: updated.daysRemaining,
        tambahanDay: updated.tambahanDay,
        data: updated
      });
    }

    if (action === 'toggle_status') {
      const updated = updateKeyStatus(targetId, status);
      return NextResponse.json({
        success: true,
        message: `Status token diubah menjadi ${status}`,
        user: updated.user,
        token: updated.token,
        dayExpired: updated.dayExpired,
        data: updated
      });
    }

    if (action === 'regenerate') {
      const updated = regenerateApiKey(targetId);
      return NextResponse.json({
        success: true,
        message: 'Token baru berhasil dihasilkan',
        user: updated.user,
        token: updated.token,
        dayExpired: updated.dayExpired,
        data: updated
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action tidak dikenal' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('token');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID atau token wajib disertakan' },
        { status: 400 }
      );
    }

    deleteKey(id);

    return NextResponse.json({
      success: true,
      message: 'Token & User berhasil dihapus'
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
