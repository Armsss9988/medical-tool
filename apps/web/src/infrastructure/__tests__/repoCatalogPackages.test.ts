import { describe, it, expect, vi } from 'vitest';
import { saveCatalogItem, deleteCatalogItem, saveTestPackage, deleteTestPackage } from '../../../lib/repo';
import type { Db } from '../../../lib/db';
import type { CatalogItem, TestPackage } from '@domain';

describe('repo: granular Catalog & Test Package CRUD', () => {
  it('deleteCatalogItem returns failure message when item is used in package_items', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ packageId: 'PKG_ALLERGEN' }])
          })
        })
      }),
      transaction: vi.fn()
    } as unknown as Db;

    const result = await deleteCatalogItem(mockDb, 'W01');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Không thể xóa chỉ số "W01" vì đang thuộc gói xét nghiệm "PKG_ALLERGEN"');
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('deleteCatalogItem succeeds and deletes item and equipment links when unreferenced', async () => {
    const mockTx = {
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    };

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      }),
      transaction: vi.fn().mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx))
    } as unknown as Db;

    const result = await deleteCatalogItem(mockDb, 'UNUSED_CODE');
    expect(result.success).toBe(true);
    expect(mockTx.delete).toHaveBeenCalledTimes(2);
  });

  it('saveCatalogItem upserts catalog item and syncs equipment links', async () => {
    const insertedValues: unknown[] = [];
    const mockTx = {
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((val) => {
          insertedValues.push(val);
          return {
            onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
          };
        })
      })),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      }),
      execute: vi.fn().mockResolvedValue(undefined)
    };

    const mockDb = {
      execute: vi.fn().mockResolvedValue(undefined),
      transaction: vi.fn().mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx))
    } as unknown as Db;

    const item: CatalogItem = {
      code: 'GLU',
      name: 'Glucose',
      category: 'Sinh hóa',
      unit: 'mmol/L',
      refText: '3.9 - 6.4',
      equipmentLinks: [
        {
          id: 'GLU_AU480',
          catalogCode: 'GLU',
          equipmentId: 'AU480',
          refMin: 3.9,
          refMax: 6.4,
          unit: 'mmol/L',
          isDefault: true
        }
      ]
    };

    await saveCatalogItem(mockDb, item);
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.insert).toHaveBeenCalled();
    expect(mockTx.delete).toHaveBeenCalled();
  });

  it('saveTestPackage upserts package and replaces packageItems', async () => {
    const mockTx = {
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
        }))
      })),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      }),
      execute: vi.fn().mockResolvedValue(undefined)
    };

    const mockDb = {
      execute: vi.fn().mockResolvedValue(undefined),
      transaction: vi.fn().mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx))
    } as unknown as Db;

    const pkg: TestPackage = {
      id: 'PKG_LIVER',
      name: 'Gói Gan Mật',
      price: 300000,
      items: [
        { code: 'AST', equipmentId: 'AU480', orderIndex: 0 },
        { code: 'ALT', equipmentId: 'AU480', orderIndex: 1 }
      ]
    };

    await saveTestPackage(mockDb, pkg);
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.delete).toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalled();
  });

  it('deleteTestPackage deletes packageItems and testPackage in transaction', async () => {
    const mockTx = {
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx))
    } as unknown as Db;

    const res = await deleteTestPackage(mockDb, 'PKG_LIVER');
    expect(res).toBe(true);
    expect(mockTx.delete).toHaveBeenCalledTimes(2);
  });
});
