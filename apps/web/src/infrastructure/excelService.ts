// ─── EXCEL SERVICE (MODULARIZED RE-EXPORT) ──────────────────────────────────
// Refactored from monolithic 2163-line file into domain-focused sub-modules under ./excel/
// Full backward compatibility for all consumers and tests.

export * from './excel/excelHelpers';
export * from './excel/excelTestGroups';
export * from './excel/excelEquipments';
export * from './excel/excelDoctors';
export * from './excel/excelCatalog';
export * from './excel/excelPackages';
export * from './excel/excelBatchPatients';
export * from './excel/excelReportsAndRevenue';
export * from './excel/excelScales';
