import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import * as repo from '@/lib/repo';
import type { TableName } from '@golab/shared/schemas/tables';

export const dynamic = 'force-dynamic';

const ALL_TABLE_NAMES: TableName[] = [
  'catalog',
  'test-packages',
  'test-groups',
  'equipments',
  'doctors',
  'clinic-info',
  'zalo-config',
  'reference-ranges',
  'catalog-item-equipments',
  'allergen-scales',
  'medical-reports',
  'invoices'
];

/**
 * GET /api/snapshots/[id]: Lấy chi tiết nội dung snapshot (để tải về file backup)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const data = await repo.getDatabaseSnapshotById(db, id);
    if (!data) {
      return NextResponse.json({ error: 'snapshot not found' }, { status: 404 });
    }
    return NextResponse.json({ id, data });
  } catch (err) {
    return NextResponse.json({ error: 'failed to get snapshot', message: (err as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/snapshots/[id]: Khôi phục dữ liệu database về bản snapshot này (Restore)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const snapshotContent = (await repo.getDatabaseSnapshotById(db, id)) as {
      tables?: Record<string, { rows?: unknown[] } | unknown[]>;
    } | null;

    if (!snapshotContent || !snapshotContent.tables) {
      return NextResponse.json({ error: 'snapshot data is empty or invalid' }, { status: 404 });
    }

    const tablesData = snapshotContent.tables;
    for (const name of ALL_TABLE_NAMES) {
      const tableEntry = tablesData[name];
      if (!tableEntry) continue;
      const rows = Array.isArray(tableEntry)
        ? tableEntry
        : (Array.isArray(tableEntry.rows) ? tableEntry.rows : []);

      await repo.replaceTable(db, name, rows);
    }

    return NextResponse.json({ success: true, message: `Đã khôi phục thành công về bản snapshot [${id}]` });
  } catch (err) {
    return NextResponse.json({ error: 'failed to restore snapshot', message: (err as Error).message }, { status: 500 });
  }
}

/**
 * DELETE /api/snapshots/[id]: Xóa một bản snapshot
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    await repo.deleteDatabaseSnapshotById(db, id);
    return NextResponse.json({ success: true, message: 'Đã xóa bản snapshot' });
  } catch (err) {
    return NextResponse.json({ error: 'failed to delete snapshot', message: (err as Error).message }, { status: 500 });
  }
}
