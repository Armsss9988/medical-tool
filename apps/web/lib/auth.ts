import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

const HEADER = 'x-app-password';

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPasskey(provided: string): { valid: boolean; message?: string } {
  const expected = process.env.APP_ACCESS_PASSWORD;
  if (!expected) {
    if (process.env.NODE_ENV === 'development') {
      return { valid: true };
    }
    return { valid: false, message: 'Hệ thống chưa cấu hình APP_ACCESS_PASSWORD trên máy chủ!' };
  }
  if (!provided) {
    return { valid: false, message: 'Vui lòng nhập Passkey!' };
  }
  if (safeEqual(provided, expected)) {
    return { valid: true };
  }
  return { valid: false, message: 'Passkey không chính xác. Vui lòng kiểm tra lại!' };
}

export function verifyAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.APP_ACCESS_PASSWORD;
  if (!expected) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return NextResponse.json({ error: 'server not configured' }, { status: 503 });
  }
  const provided = req.headers.get(HEADER) ?? '';
  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}
