import { AnyPgTable } from 'drizzle-orm/pg-core';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { TableName } from '@golab/shared/schemas/tables';
import * as tables from './schema';
import type { Db } from './db';
import type { MedicalReport, Invoice, AllergenGradingScale, TestPackage, Gender } from '@domain/types';

export const TABLES: Record<TableName, AnyPgTable> = {
  catalog: tables.catalogItems,
  'test-packages': tables.testPackages,
  'test-groups': tables.testGroups,
  equipments: tables.equipments,
  doctors: tables.doctors,
  'clinic-info': tables.clinicInfo,
  'zalo-config': tables.zaloConfig,
  'reference-ranges': tables.referenceRanges,
  'catalog-item-equipments': tables.catalogItemEquipments,
  'allergen-scales': tables.allergenScales,
  'medical-reports': tables.medicalReports,
  invoices: tables.invoices
};

/**
 * Nạp dữ liệu các bảng theo chuẩn Quan Hệ (Relational JOIN / Subquery)
 * và ánh xạ sang Domain Models hoàn chỉnh mà Frontend yêu cầu.
 */
export async function getTableRows(db: Db, name: TableName): Promise<unknown[]> {
  switch (name) {
    case 'medical-reports': {
      const reports = await db.select().from(tables.medicalReports).orderBy(desc(tables.medicalReports.createdAt));
      const allTests = await db.select().from(tables.medicalReportTests).orderBy(asc(tables.medicalReportTests.testOrder));

      const testsByReportId = new Map<string, typeof allTests>();
      for (const t of allTests) {
        if (!testsByReportId.has(t.reportId)) {
          testsByReportId.set(t.reportId, []);
        }
        testsByReportId.get(t.reportId)!.push(t);
      }

      return reports.map((rep): MedicalReport => {
        const tests = testsByReportId.get(rep.id) || [];
        return {
          id: rep.id,
          code: rep.code,
          sampleCode: rep.sampleCode || rep.code,
          status: rep.status as MedicalReport['status'],
          doctorName: rep.doctorName || '',
          conclusion: rep.conclusion || '',
          isAllergen: rep.isAllergen,
          testCount: tests.length,
          invoiceId: rep.invoiceId || undefined,
          cloudPdfUrl: rep.cloudPdfUrl || undefined,
          qrCodeDataUrl: rep.qrCodeDataUrl || undefined,
          pdfVersion: rep.pdfVersion,
          isPdfOutdated: rep.isPdfOutdated,
          pdfGeneratedAt: rep.pdfGeneratedAt ? rep.pdfGeneratedAt.toISOString() : undefined,
          zaloSentAt: rep.zaloSentAt ? rep.zaloSentAt.toISOString() : undefined,
          zaloMsgId: rep.zaloMsgId || undefined,
          patient: {
            code: rep.code,
            name: rep.patientName,
            dob: rep.patientDob || '',
            gender: (rep.patientGender as MedicalReport['patient']['gender']) || 'Nam',
            phone: rep.patientPhone || '',
            address: rep.patientAddress || '',
            diagnosis: rep.patientDiagnosis || '',
            orderedAt: rep.patientOrderedAt || '',
            receivedAt: rep.patientReceivedAt || '',
            returnedAt: rep.patientReturnedAt || '',
            secretToken: rep.patientSecretToken || '',
            sampleCode: rep.sampleCode || rep.code,
            sampleStatus: rep.patientSampleStatus || 'Đạt'
          },
          selectedTests: tests.map((t) => ({
            code: t.testCode,
            name: t.testName,
            category: t.category || '',
            result: t.result,
            note: t.note || '',
            unit: t.unit || '',
            refMin: t.refMin ?? undefined,
            refMax: t.refMax ?? undefined,
            refText: t.refText || '',
            price: t.price || 0,
            equipmentId: t.equipmentId || undefined,
            equipment: t.equipmentName || undefined,
            scaleId: t.scaleId || undefined,
            evaluationType: (t.evaluationType as 'range' | 'scale') || undefined,
            scientific: t.scientific || undefined
          })),
          createdAt: rep.createdAt ? rep.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: rep.updatedAt ? rep.updatedAt.toISOString() : new Date().toISOString()
        };
      });
    }

    case 'invoices': {
      const invList = await db.select().from(tables.invoices).orderBy(desc(tables.invoices.createdAt));
      const allItems = await db.select().from(tables.invoiceItems).orderBy(asc(tables.invoiceItems.itemOrder));

      const itemsByInvoiceId = new Map<string, typeof allItems>();
      for (const item of allItems) {
        if (!itemsByInvoiceId.has(item.invoiceId)) {
          itemsByInvoiceId.set(item.invoiceId, []);
        }
        itemsByInvoiceId.get(item.invoiceId)!.push(item);
      }

      return invList.map((inv): Invoice => {
        const items = itemsByInvoiceId.get(inv.id) || [];
        return {
          id: inv.id,
          code: inv.code,
          reportId: inv.reportId || undefined,
          patientCode: inv.patientCode || undefined,
          patientName: inv.patientName || '',
          patientPhone: inv.patientPhone || '',
          patientDob: '',
          patientGender: 'Nam' as Gender,
          doctorName: inv.doctorName || '',
          cashierName: inv.cashierName || undefined,
          status: inv.status as Invoice['status'],
          paymentMethod: (inv.paymentMethod as Invoice['paymentMethod']) || 'Tiền mặt',
          totalAmount: inv.subtotal,
          discountAmount: inv.discountAmount,
          discountPercent: inv.discountPercent,
          surchargeAmount: inv.surchargeAmount,
          finalAmount: inv.finalAmount,
          paidAt: inv.paidAt ? inv.paidAt.toISOString() : undefined,
          notes: inv.notes || undefined,
          items: items.map((it) => ({
            code: it.code,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            unit: it.unit || undefined
          })),
          createdAt: inv.createdAt ? inv.createdAt.toISOString() : new Date().toISOString()
        };
      });
    }

    case 'allergen-scales': {
      const scales = await db.select().from(tables.allergenScales).orderBy(asc(tables.allergenScales.id));
      const allLevels = await db.select().from(tables.allergenScaleLevels).orderBy(asc(tables.allergenScaleLevels.orderIndex));

      const levelsByScaleId = new Map<string, typeof allLevels>();
      for (const l of allLevels) {
        if (!levelsByScaleId.has(l.scaleId)) {
          levelsByScaleId.set(l.scaleId, []);
        }
        levelsByScaleId.get(l.scaleId)!.push(l);
      }

      return scales.map((s): AllergenGradingScale => {
        const levels = levelsByScaleId.get(s.id) || [];
        return {
          id: s.id,
          name: s.name,
          equipment: s.equipment || undefined,
          unit: s.unit,
          levels: levels.map((l) => ({
            grade: l.grade,
            minVal: l.minVal,
            maxVal: l.maxVal,
            rangeText: l.rangeText,
            label: l.label,
            isPositive: l.isPositive,
            colorKey: l.colorKey || undefined
          }))
        };
      });
    }

    case 'test-packages': {
      const pkgs = await db.select().from(tables.testPackages).orderBy(asc(tables.testPackages.id));
      const allItems = await db.select().from(tables.packageItems).orderBy(asc(tables.packageItems.orderIndex));

      const itemsByPackageId = new Map<string, typeof allItems>();
      for (const pi of allItems) {
        if (!itemsByPackageId.has(pi.packageId)) {
          itemsByPackageId.set(pi.packageId, []);
        }
        itemsByPackageId.get(pi.packageId)!.push(pi);
      }

      return pkgs.map((p): TestPackage => {
        const items = itemsByPackageId.get(p.id) || [];
        const packageItems = items.map((pi) => ({
          code: pi.catalogCode,
          equipmentId: pi.equipmentId || null
        }));
        return {
          id: p.id,
          name: p.name,
          defaultEquipmentId: p.defaultEquipmentId || undefined,
          price: p.price,
          items: packageItems,
          codes: packageItems.map((pi) => pi.code)
        };
      });
    }

    default: {
      const table = TABLES[name];
      return (await db.select().from(table)) as unknown[];
    }
  }
}

/**
 * Ghi đè toàn bộ dữ liệu bảng theo Transaction quan hệ (Master-Detail)
 */
export async function replaceTable(db: Db, name: TableName, rows: unknown[]): Promise<number> {
  const BATCH_SIZE = 100;

  return db.transaction(async (tx) => {
    switch (name) {
      case 'medical-reports': {
        const reportList = rows as MedicalReport[];
        await tx.delete(tables.medicalReportTests);
        await tx.delete(tables.medicalReports);

        if (reportList.length === 0) return 0;

        const reportValues = reportList.map((rep) => ({
          id: rep.id,
          code: rep.code || rep.patient?.code || 'BN',
          sampleCode: rep.sampleCode || rep.patient?.sampleCode || null,
          status: rep.status || 'Chờ xét nghiệm',
          doctorName: rep.doctorName || null,
          conclusion: rep.conclusion || null,
          isAllergen: rep.isAllergen || false,
          invoiceId: rep.invoiceId || null,
          cloudPdfUrl: rep.cloudPdfUrl || null,
          qrCodeDataUrl: rep.qrCodeDataUrl || null,
          pdfVersion: rep.pdfVersion || 1,
          isPdfOutdated: rep.isPdfOutdated || false,
          pdfGeneratedAt: rep.pdfGeneratedAt ? new Date(rep.pdfGeneratedAt) : null,
          zaloSentAt: rep.zaloSentAt ? new Date(rep.zaloSentAt) : null,
          zaloMsgId: rep.zaloMsgId || null,
          patientName: rep.patient?.name || '',
          patientDob: rep.patient?.dob || null,
          patientGender: rep.patient?.gender || null,
          patientPhone: rep.patient?.phone || null,
          patientAddress: rep.patient?.address || null,
          patientDiagnosis: rep.patient?.diagnosis || null,
          patientOrderedAt: rep.patient?.orderedAt || null,
          patientReceivedAt: rep.patient?.receivedAt || null,
          patientReturnedAt: rep.patient?.returnedAt || null,
          patientSecretToken: rep.patient?.secretToken || null,
          patientSampleStatus: rep.patient?.sampleStatus || null,
          createdAt: rep.createdAt ? new Date(rep.createdAt) : new Date(),
          updatedAt: rep.updatedAt ? new Date(rep.updatedAt) : new Date()
        }));

        for (let i = 0; i < reportValues.length; i += BATCH_SIZE) {
          await tx.insert(tables.medicalReports).values(reportValues.slice(i, i + BATCH_SIZE));
        }

        const allTests: (typeof tables.medicalReportTests.$inferInsert)[] = [];
        for (const rep of reportList) {
          const tests = Array.isArray(rep.selectedTests) ? rep.selectedTests : [];
          for (let idx = 0; idx < tests.length; idx++) {
            const t = tests[idx];
            allTests.push({
              id: `${rep.id}_${t.code || idx}_${idx}`,
              reportId: rep.id,
              testOrder: idx,
              testCode: t.code || `T${idx + 1}`,
              testName: t.name || 'Chỉ số',
              category: t.category || null,
              result: t.result || '',
              note: t.note || null,
              unit: t.unit || null,
              refMin: t.refMin ?? null,
              refMax: t.refMax ?? null,
              refText: t.refText || null,
              price: t.price || 0,
              equipmentId: t.equipmentId || null,
              equipmentName: t.equipment || null,
              scaleId: t.scaleId || null,
              evaluationType: t.evaluationType || null,
              scientific: t.scientific || null,
              createdAt: new Date()
            });
          }
        }

        for (let i = 0; i < allTests.length; i += BATCH_SIZE) {
          await tx.insert(tables.medicalReportTests).values(allTests.slice(i, i + BATCH_SIZE));
        }

        return reportList.length;
      }

      case 'invoices': {
        const invoiceList = rows as Invoice[];
        await tx.delete(tables.invoiceItems);
        await tx.delete(tables.invoices);

        if (invoiceList.length === 0) return 0;

        const invValues = invoiceList.map((inv) => {
          const subtotal = inv.totalAmount || 0;
          return {
            id: inv.id,
            code: inv.code,
            reportId: inv.reportId || null,
            patientCode: inv.patientCode || null,
            patientName: inv.patientName || null,
            patientPhone: inv.patientPhone || null,
            doctorName: inv.doctorName || null,
            cashierName: inv.cashierName || null,
            status: inv.status || 'Chưa thu phí',
            paymentMethod: inv.paymentMethod || 'Tiền mặt',
            subtotal,
            discountAmount: inv.discountAmount || 0,
            discountPercent: inv.discountPercent || 0,
            discountType: 'amount',
            surchargeAmount: inv.surchargeAmount || 0,
            finalAmount: inv.finalAmount || 0,
            paidAt: inv.paidAt ? new Date(inv.paidAt) : null,
            cancelledAt: null,
            notes: inv.notes || null,
            createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
            updatedAt: new Date()
          };
        });

        for (let i = 0; i < invValues.length; i += BATCH_SIZE) {
          await tx.insert(tables.invoices).values(invValues.slice(i, i + BATCH_SIZE));
        }

        const allItems: (typeof tables.invoiceItems.$inferInsert)[] = [];
        for (const inv of invoiceList) {
          const items = Array.isArray(inv.items) ? inv.items : [];
          for (let idx = 0; idx < items.length; idx++) {
            const it = items[idx];
            const price = it.price || 0;
            const quantity = it.quantity || 1;
            allItems.push({
              id: `${inv.id}_${it.code || idx}_${idx}`,
              invoiceId: inv.id,
              itemOrder: idx,
              code: it.code || `DV${idx + 1}`,
              name: it.name || 'Dịch vụ',
              price,
              quantity,
              unit: it.unit || null,
              total: price * quantity
            });
          }
        }

        for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
          await tx.insert(tables.invoiceItems).values(allItems.slice(i, i + BATCH_SIZE));
        }

        return invoiceList.length;
      }

      case 'allergen-scales': {
        const scaleList = rows as AllergenGradingScale[];
        await tx.delete(tables.allergenScaleLevels);
        await tx.delete(tables.allergenScales);

        if (scaleList.length === 0) return 0;

        const scaleValues = scaleList.map((s) => ({
          id: s.id,
          name: s.name,
          equipment: s.equipment || null,
          unit: s.unit || 'IU/ml',
          updatedAt: new Date()
        }));
        await tx.insert(tables.allergenScales).values(scaleValues);

        const allLevels: (typeof tables.allergenScaleLevels.$inferInsert)[] = [];
        for (const s of scaleList) {
          const levels = Array.isArray(s.levels) ? s.levels : [];
          for (let idx = 0; idx < levels.length; idx++) {
            const l = levels[idx];
            allLevels.push({
              id: `${s.id}_grade_${l.grade}`,
              scaleId: s.id,
              grade: l.grade,
              minVal: l.minVal ?? 0,
              maxVal: l.maxVal ?? null,
              rangeText: l.rangeText || '',
              label: l.label || '',
              isPositive: l.isPositive ?? false,
              colorKey: l.colorKey || null,
              orderIndex: idx
            });
          }
        }

        for (let i = 0; i < allLevels.length; i += BATCH_SIZE) {
          await tx.insert(tables.allergenScaleLevels).values(allLevels.slice(i, i + BATCH_SIZE));
        }

        return scaleList.length;
      }

      case 'test-packages': {
        const packageList = rows as TestPackage[];
        await tx.delete(tables.packageItems);
        await tx.delete(tables.testPackages);

        if (packageList.length === 0) return 0;

        const pkgValues = packageList.map((p) => ({
          id: p.id,
          name: (p.name && p.name.trim()) || 'Gói xét nghiệm mới',
          defaultEquipmentId: p.defaultEquipmentId || null,
          price: p.price || 0,
          updatedAt: new Date()
        }));

        for (let i = 0; i < pkgValues.length; i += BATCH_SIZE) {
          await tx.insert(tables.testPackages).values(pkgValues.slice(i, i + BATCH_SIZE));
        }

        const allPackageItems: (typeof tables.packageItems.$inferInsert)[] = [];
        for (const p of packageList) {
          const items = p.items || (p.codes || []).map((c) => ({ code: c, equipmentId: null }));
          for (let idx = 0; idx < items.length; idx++) {
            const it = items[idx] as { code?: string; equipmentId?: string | null } | string;
            const code = typeof it === 'string' ? it : (it.code || '');
            const eqId = typeof it === 'object' ? (it.equipmentId || null) : null;
            if (!code) continue;
            allPackageItems.push({
              id: `${p.id}_${code}_${idx}`,
              packageId: p.id,
              catalogCode: code,
              equipmentId: eqId,
              orderIndex: idx
            });
          }
        }

        for (let i = 0; i < allPackageItems.length; i += BATCH_SIZE) {
          await tx.insert(tables.packageItems).values(allPackageItems.slice(i, i + BATCH_SIZE));
        }

        return packageList.length;
      }

      case 'test-groups': {
        const groupList = rows as { id: string; name: string }[];
        if (groupList.length === 0) return 0;

        // 1. Batch upsert all incoming groups in ONE query
        const groupValues = groupList.map((g) => ({
          id: g.id,
          name: g.name,
          updatedAt: new Date()
        }));

        for (let i = 0; i < groupValues.length; i += BATCH_SIZE) {
          await tx
            .insert(tables.testGroups)
            .values(groupValues.slice(i, i + BATCH_SIZE))
            .onConflictDoUpdate({
              target: tables.testGroups.id,
              set: {
                name: sql`excluded.name`,
                updatedAt: sql`excluded.updated_at`
              }
            });
        }

        // 2. Safely delete only groups not present in incoming list AND not referenced in catalog_items
        const newGroupIds = new Set(groupList.map((g) => g.id));
        const usedCategories = await tx
          .selectDistinct({ category: tables.catalogItems.category })
          .from(tables.catalogItems);
        const usedSet = new Set(usedCategories.map((c) => c.category));

        const existingGroups = await tx.select().from(tables.testGroups);
        const idsToDelete = existingGroups
          .filter((eg) => !newGroupIds.has(eg.id) && !usedSet.has(eg.name))
          .map((eg) => eg.id);

        if (idsToDelete.length > 0) {
          await tx.delete(tables.testGroups).where(inArray(tables.testGroups.id, idsToDelete));
        }

        return groupList.length;
      }

      default: {
        const table = TABLES[name];
        await tx.delete(table);
        if (rows.length > 0) {
          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            await tx.insert(table).values(rows.slice(i, i + BATCH_SIZE) as never[]);
          }
        }
        return rows.length;
      }
    }
  });
}

/**
 * Quản lý Snapshot Hệ Thống (Snapshots Repository)
 */
export async function createDatabaseSnapshot(db: Db, name: string, description: string, data: unknown, createdBy: string = 'User'): Promise<string> {
  const id = `snap_${Date.now()}`;
  await db.insert(tables.databaseSnapshots).values({
    id,
    name,
    description,
    data,
    createdBy,
    createdAt: new Date()
  });
  return id;
}

export async function listDatabaseSnapshots(db: Db): Promise<{ id: string; name: string; description: string | null; createdBy: string | null; createdAt: string }[]> {
  const rows = await db.select({
    id: tables.databaseSnapshots.id,
    name: tables.databaseSnapshots.name,
    description: tables.databaseSnapshots.description,
    createdBy: tables.databaseSnapshots.createdBy,
    createdAt: tables.databaseSnapshots.createdAt
  }).from(tables.databaseSnapshots).orderBy(desc(tables.databaseSnapshots.createdAt));

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
  }));
}

export async function getDatabaseSnapshotById(db: Db, id: string): Promise<unknown | null> {
  const [row] = await db.select().from(tables.databaseSnapshots).where(eq(tables.databaseSnapshots.id, id));
  return row ? row.data : null;
}

export async function deleteDatabaseSnapshotById(db: Db, id: string): Promise<boolean> {
  await db.delete(tables.databaseSnapshots).where(eq(tables.databaseSnapshots.id, id));
  return true;
}
