// ─── FEATURE SLICE: CATALOG MANAGEMENT ─────────────────────────────────────
// Manages medical test catalog, packages, groups, equipment, doctor roster, and pricing scales.

export { default as CatalogManagerModal } from './components/CatalogManagerModal';
export { useCatalogData } from './hooks/useCatalogData';
export { ManageCatalogUseCase } from './usecases/ManageCatalogUseCase';
