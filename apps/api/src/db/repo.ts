import { AnyPgTable } from 'drizzle-orm/pg-core';
import type { TableName } from '@golab/shared/schemas/tables';
import * as tables from './schema';
import type { Db } from './client';

export const TABLES: Record<TableName, AnyPgTable> = {
  catalog: tables.catalogItems,
  'test-packages': tables.testPackages,
  'test-groups': tables.testGroups,
  equipments: tables.equipments,
  doctors: tables.doctors,
  'clinic-info': tables.clinicInfo,
  'zalo-config': tables.zaloConfig,
  'medical-reports': tables.medicalReports,
  invoices: tables.invoices
};

const DOC_TABLES: ReadonlySet<TableName> = new Set(['medical-reports', 'invoices']);

export async function getTableRows(db: Db, name: TableName): Promise<unknown[]> {
  const table = TABLES[name];
  return (await db.select().from(table)) as unknown[];
}

export async function replaceTable(db: Db, name: TableName, rows: unknown[]): Promise<number> {
  const table = TABLES[name];
  const values =
    DOC_TABLES.has(name)
      ? (rows as { id: string }[]).map((r) => ({ id: r.id, data: r }))
      : (rows as never[]);
  return db.transaction(async (tx) => {
    await tx.delete(table);
    if (values.length > 0) {
      await tx.insert(table).values(values);
    }
    return rows.length;
  });
}
