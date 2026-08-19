import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === expectedPassword) {
      return NextResponse.json({
        success: true,
        message: 'Login Admin berhasil',
        token: 'adm_session_valid_key_8899'
      });
    }

    return NextResponse.json(
      { success: false, message: 'Password / PIN Admin salah!' },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Bad request: ' + err.message },
      { status: 400 }
    );
  }
}
