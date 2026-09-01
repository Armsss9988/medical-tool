import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

const createSnapshotBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  createdBy: z.string().optional().default('User')
});

/**
 * GET /api/snapshots: Danh sách tất cả các bản snapshot đã lưu
 */
export async function GET(req: NextRequest) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ snapshots: [] });
  }

  try {
    const snapshots = await repo.listDatabaseSnapshots(db);
    return NextResponse.json({ snapshots });
  } catch (err) {
    return NextResponse.json({ error: 'failed to list snapshots', message: (err as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/snapshots: Tạo một bản snapshot toàn bộ dữ liệu 12 bảng hiện tại
 */
export async function POST(req: NextRequest) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  let body: z.infer<typeof createSnapshotBodySchema>;
  try {
    const raw = await req.json();
    body = createSnapshotBodySchema.parse(raw);
  } catch (err) {
    return NextResponse.json({ error: 'invalid body', message: (err as Error).message }, { status: 400 });
  }

  try {
    // 1. Đọc toàn bộ 12 bảng dữ liệu
    const fullData: Record<string, unknown> = {
      _meta: {
        snapshotAt: new Date().toISOString(),
        name: body.name,
        description: body.description,
        createdBy: body.createdBy
      },
      tables: {}
    };

    const tablesObj: Record<string, unknown> = {};
    for (const name of ALL_TABLE_NAMES) {
      const rows = await repo.getTableRows(db, name);
      tablesObj[name] = { count: rows.length, rows };
    }
    fullData.tables = tablesObj;

    // 2. Lưu snapshot vào database_snapshots
    const id = await repo.createDatabaseSnapshot(db, body.name, body.description, fullData, body.createdBy);

    return NextResponse.json({ success: true, id, message: 'Đã tạo bản snapshot thành công' });
  } catch (err) {
    return NextResponse.json({ error: 'failed to create snapshot', message: (err as Error).message }, { status: 500 });
  }
}
