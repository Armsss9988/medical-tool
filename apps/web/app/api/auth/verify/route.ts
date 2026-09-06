import { NextRequest, NextResponse } from 'next/server';
import { checkPasskey } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const passkey = typeof body.passkey === 'string' ? body.passkey.trim() : '';

    const check = checkPasskey(passkey);
    if (!check.valid) {
      return NextResponse.json(
        { ok: false, message: check.message || 'Passkey không chính xác' },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Xác thực thành công!' });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Lỗi trong quá trình kiểm tra passkey' },
      { status: 500 }
    );
  }
}
