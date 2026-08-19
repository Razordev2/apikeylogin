import { NextResponse } from 'next/server';
import { validateIntegratedPipeline } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token') || searchParams.get('key') || searchParams.get('userToken');
    let webApiKey = searchParams.get('webApiKey') || searchParams.get('web_key');
    let username = searchParams.get('username') || searchParams.get('user');

    if (!webApiKey) {
      webApiKey = request.headers.get('x-web-api-key') || request.headers.get('x-web-key');
    }

    if (!token) {
      token = request.headers.get('x-api-key') || request.headers.get('x-token');
    }

    const result = validateIntegratedPipeline({ webApiKey, userToken: token, username });
    const statusCode = result.success ? 200 : 401;

    return NextResponse.json(result, { status: statusCode });
  } catch (err) {
    return NextResponse.json(
      { status: 'FAILED', success: false, valid: false, message: 'Server error: ' + err.message },
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
    const token = body.token || body.key || body.userToken || searchParams.get('token') || searchParams.get('key');
    const webApiKey = body.webApiKey || body.web_key || searchParams.get('webApiKey') || request.headers.get('x-web-api-key');
    const username = body.username || body.user || searchParams.get('username');

    const result = validateIntegratedPipeline({ webApiKey, userToken: token, username });
    const statusCode = result.success ? 200 : 401;

    return NextResponse.json(result, { status: statusCode });
  } catch (err) {
    return NextResponse.json(
      { status: 'FAILED', success: false, valid: false, message: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}
