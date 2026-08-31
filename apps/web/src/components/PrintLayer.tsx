import PrintReportView from './PrintReportView';
import FullAllergenReportView from './FullAllergenReportView';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { PRINT_ELEMENT_ID } from '@domain/constants';
import { hasAllergenTests } from '@domain/allergenDetector';
import type { ClinicInfo, MedicalReport, TestPackage, TestEquipment, CatalogItemEquipmentLink } from '@domain';

// ─── PRINT LAYER COMPONENT ──────────────────────────────────────────────────
// Hidden off-screen DOM elements for pixel-perfect A4 printing & PDF capture.

interface PrintLayerProps {
  clinicInfo: ClinicInfo;
  qrCodeDataUrl?: string;
  batchRenderReport: MedicalReport | null;
  testPackages?: TestPackage[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
}

export function PrintLayer({
  clinicInfo,
  qrCodeDataUrl,
  batchRenderReport,
  testPackages = [],
  equipments = [],
  catalogItemEquipments = []
}: PrintLayerProps) {
  const {
    patient,
    selectedTests,
    conclusion,
    doctorName
  } = useWorkspace();

  const isAllergenPackage = hasAllergenTests(selectedTests);

  return (
    <div
      className="fixed -left-[9999px] top-0 pointer-events-none overflow-hidden"
      style={{ width: '210mm', minWidth: '210mm', maxWidth: '210mm', opacity: 1, zIndex: -100 }}
    >
      {isAllergenPackage ? (
        <FullAllergenReportView
          elementId={PRINT_ELEMENT_ID.ALLERGEN_REPORT}
          clinicInfo={clinicInfo}
          patient={patient}
          selectedTests={selectedTests}
          doctorName={doctorName}
          qrCodeDataUrl={qrCodeDataUrl}
          testPackages={testPackages}
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
          {batchRenderReport.isAllergen ? (
            <FullAllergenReportView
              elementId={PRINT_ELEMENT_ID.BATCH_ALLERGEN}
              clinicInfo={clinicInfo}
              patient={batchRenderReport.patient}
              selectedTests={batchRenderReport.selectedTests}
              doctorName={batchRenderReport.doctorName}
              qrCodeDataUrl={undefined}
              testPackages={testPackages}
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
