import PrintReportView from './PrintReportView';
import FullAllergenReportView from './FullAllergenReportView';
import HybridReportView from './HybridReportView';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { PRINT_ELEMENT_ID } from '@domain/constants';
import { hasAllergenTests, hasMixedTests } from '@domain/allergenDetector';
import type { ClinicInfo, MedicalReport, TestPackage, TestEquipment, CatalogItemEquipmentLink, AllergenGradingScale } from '@domain';

// ─── PRINT LAYER COMPONENT ──────────────────────────────────────────────────
// Hidden off-screen DOM elements for pixel-perfect A4 printing & PDF capture.

interface PrintLayerProps {
  clinicInfo: ClinicInfo;
  qrCodeDataUrl?: string;
  batchRenderReport: MedicalReport | null;
  testPackages?: TestPackage[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  allergenScales?: AllergenGradingScale[];
}

export function PrintLayer({
  clinicInfo,
  qrCodeDataUrl,
  batchRenderReport,
  testPackages = [],
  equipments = [],
  catalogItemEquipments = [],
  allergenScales = []
}: PrintLayerProps) {
  const {
    patient,
    selectedTests,
    conclusion,
    doctorName
  } = useWorkspace();

  const isMixed = hasMixedTests(selectedTests);
  const isAllergen = !isMixed && hasAllergenTests(selectedTests);

  const isBatchMixed = batchRenderReport ? hasMixedTests(batchRenderReport.selectedTests) : false;
  const isBatchAllergen = batchRenderReport
    ? (!isBatchMixed && (batchRenderReport.isAllergen || hasAllergenTests(batchRenderReport.selectedTests)))
    : false;

  return (
    <div
      className="fixed -left-[9999px] top-0 pointer-events-none overflow-hidden"
      style={{ width: '210mm', minWidth: '210mm', maxWidth: '210mm', opacity: 1, zIndex: -100 }}
    >
      {isMixed ? (
        <HybridReportView
          elementId={PRINT_ELEMENT_ID.HYBRID_REPORT}
          clinicInfo={clinicInfo}
          patient={patient}
          selectedTests={selectedTests}
          doctorName={doctorName}
          conclusion={conclusion}
          qrCodeDataUrl={qrCodeDataUrl}
          testPackages={testPackages}
          allergenScales={allergenScales}
          equipments={equipments}
          catalogItemEquipments={catalogItemEquipments}
        />
      ) : isAllergen ? (
        <FullAllergenReportView
          elementId={PRINT_ELEMENT_ID.ALLERGEN_REPORT}
          clinicInfo={clinicInfo}
          patient={patient}
          selectedTests={selectedTests}
          doctorName={doctorName}
          conclusion={conclusion}
          qrCodeDataUrl={qrCodeDataUrl}
          testPackages={testPackages}
          allergenScales={allergenScales}
          equipments={equipments}
          catalogItemEquipments={catalogItemEquipments}
        />
      ) : (
        <PrintReportView
          elementId={PRINT_ELEMENT_ID.MEDICAL_REPORT}
          clinicInfo={clinicInfo}
          patient={patient}
          selectedTests={selectedTests}
          conclusion={conclusion}
          doctorName={doctorName}
          qrCodeDataUrl={qrCodeDataUrl}
          equipments={equipments}
          catalogItemEquipments={catalogItemEquipments}
        />
      )}

      {/* HIDDEN BATCH RENDER AREA — cho xuất PDF đồng loạt */}
      {batchRenderReport && (
        <>
          {isBatchMixed ? (
            <HybridReportView
              elementId={PRINT_ELEMENT_ID.BATCH_HYBRID}
              clinicInfo={clinicInfo}
              patient={batchRenderReport.patient}
              selectedTests={batchRenderReport.selectedTests}
              doctorName={batchRenderReport.doctorName}
              conclusion={batchRenderReport.conclusion}
              qrCodeDataUrl={undefined}
              testPackages={testPackages}
              allergenScales={allergenScales}
              equipments={equipments}
              catalogItemEquipments={catalogItemEquipments}
            />
          ) : isBatchAllergen ? (
            <FullAllergenReportView
              elementId={PRINT_ELEMENT_ID.BATCH_ALLERGEN}
              clinicInfo={clinicInfo}
              patient={batchRenderReport.patient}
              selectedTests={batchRenderReport.selectedTests}
              doctorName={batchRenderReport.doctorName}
              conclusion={batchRenderReport.conclusion}
              qrCodeDataUrl={undefined}
              testPackages={testPackages}
              allergenScales={allergenScales}
              equipments={equipments}
              catalogItemEquipments={catalogItemEquipments}
            />
          ) : (
            <PrintReportView
              elementId={PRINT_ELEMENT_ID.BATCH_MEDICAL}
              clinicInfo={clinicInfo}
              patient={batchRenderReport.patient}
              selectedTests={batchRenderReport.selectedTests}
              conclusion={batchRenderReport.conclusion}
              doctorName={batchRenderReport.doctorName}
              qrCodeDataUrl={undefined}
              equipments={equipments}
              catalogItemEquipments={catalogItemEquipments}
            />
          )}
        </>
      )}
    </div>
  );
}
