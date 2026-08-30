import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

const HEADER = 'x-app-password';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAuth(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  const expected = process.env.APP_ACCESS_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'server not configured' }, { status: 503 });
  }
  const provided = req.headers.get(HEADER) ?? '';
  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}
