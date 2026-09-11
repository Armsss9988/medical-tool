import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { saveTestPackage } from '@/lib/repo';
import type { TestPackage } from '@domain';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const pkg = (await req.json()) as TestPackage;
    if (!pkg || !pkg.id || !pkg.name) {
      return NextResponse.json({ error: 'Missing required fields: id and name' }, { status: 400 });
    }
    await saveTestPackage(db, pkg);
    return NextResponse.json({ success: true, id: pkg.id });
  } catch (err) {
    console.error('[API POST /api/packages] Error:', err);
    return NextResponse.json({ error: 'Failed to save test package', message: (err as Error).message }, { status: 500 });
  }
}
