import { describe, expect, it } from 'vitest';
import * as repo from '../db/repo';
import type { Db } from '../db/client';

type FakeDb = {
  calls: {
    selectFrom: number;
    delete: number;
    insertValues: unknown[] | null;
    inTransaction: boolean;
  };
  rows: unknown[];
};

function fakeDb(rows: unknown[]): FakeDb {
  const calls = { selectFrom: 0, delete: 0, insertValues: null as unknown[] | null, inTransaction: false };
  const db = {
    calls,
    rows,
    transaction: async (fn: (tx: FakeDb) => Promise<unknown>) => {
      calls.inTransaction = true;
      return fn(db as unknown as FakeDb);
    },
    select: () => ({
      from: () => {
        calls.selectFrom++;
        return Promise.resolve(rows);
      }
    }),
    delete: () => {
      calls.delete++;
      return Promise.resolve();
    },
    insert: () => ({
      values: (v: unknown[]) => {
        calls.insertValues = v;
        return Promise.resolve();
      }
    })
  } as unknown as FakeDb;
  return db;
}

describe('repo.getTableRows', () => {
  it('selects all rows from the mapped table', async () => {
    const db = fakeDb([{ code: 'GLU', name: 'Glucose' }]);
    const rows = await repo.getTableRows(db as unknown as Db, 'catalog');
    expect(db.calls.selectFrom).toBe(1);
    expect(rows).toEqual([{ code: 'GLU', name: 'Glucose' }]);
  });
});

describe('repo.replaceTable', () => {
  it('deletes then inserts rows inside a transaction and returns count', async () => {
    const db = fakeDb([]);
    const rows = [{ code: 'GLU', name: 'Glucose' }];
    const count = await repo.replaceTable(db as unknown as Db, 'catalog', rows);
    expect(db.calls.inTransaction).toBe(true);
    expect(db.calls.delete).toBe(1);
    expect(db.calls.insertValues).toEqual(rows);
    expect(count).toBe(1);
  });

  it('skips insert when there are no rows', async () => {
    const db = fakeDb([]);
    const count = await repo.replaceTable(db as unknown as Db, 'catalog', []);
    expect(db.calls.delete).toBe(1);
    expect(db.calls.insertValues).toBeNull();
    expect(count).toBe(0);
  });

  it('wraps document rows as { id, data } for jsonb tables', async () => {
    const db = fakeDb([]);
    const rows = [{ id: 'r1', patient: { name: 'A' }, status: 'x' }];
    await repo.replaceTable(db as unknown as Db, 'medical-reports', rows);
    expect(db.calls.insertValues).toEqual([{ id: 'r1', data: rows[0] }]);
  });
});
