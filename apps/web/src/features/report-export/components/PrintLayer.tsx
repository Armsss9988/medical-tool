import PrintReportView from './PrintReportView';
import FullAllergenReportView from './FullAllergenReportView';
import HybridReportView from './HybridReportView';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { PRINT_ELEMENT_ID } from '@domain/constants';
import { ReportKindResolver } from '@domain/valueObjects/ReportKind';
import type { ClinicInfo, MedicalReport, TestPackage, TestEquipment, CatalogItemEquipmentLink, AllergenGradingScale, ReportTemplate } from '@domain';
import type { DynamicReportRenderProps } from '../types';

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
  activeTemplate?: ReportTemplate;
  renderDynamicReport?: (props: DynamicReportRenderProps) => React.ReactNode;
}

export function PrintLayer({
  clinicInfo,
  qrCodeDataUrl,
  batchRenderReport,
  testPackages = [],
  equipments = [],
  catalogItemEquipments = [],
  allergenScales = [],
  activeTemplate,
  renderDynamicReport
}: PrintLayerProps) {
  const {
    patient,
    selectedTests,
    conclusion,
    doctorName
  } = useWorkspace();

  const reportKind = ReportKindResolver.resolve(selectedTests);
  const batchReportKind = batchRenderReport
    ? ReportKindResolver.resolve(batchRenderReport.selectedTests, { isBatch: true })
    : null;

  return (
    <div
      className="fixed -left-[9999px] top-0 pointer-events-none overflow-hidden"
      style={{ width: '210mm', minWidth: '210mm', maxWidth: '210mm', opacity: 1, zIndex: -100 }}
    >
      {reportKind.type === 'hybrid' ? (
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
      ) : reportKind.type === 'allergen' ? (
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
          testPackages={testPackages}
        />
      )}

      {/* RENDER BẢN MẪU ĐỘNG THEO TEMPLATE BUILDER (CHO XUẤT PDF & IN ẤN ĐỘNG) */}
      {activeTemplate && renderDynamicReport && (
        renderDynamicReport({
          elementId: PRINT_ELEMENT_ID.DYNAMIC_REPORT,
          template: activeTemplate,
          clinicInfo,
          patient,
          selectedTests,
          conclusion,
          doctorName,
          qrCodeDataUrl,
          testPackages,
          equipments,
          catalogItemEquipments,
          allergenScales
        })
      )}

      {/* HIDDEN BATCH RENDER AREA — cho xuất PDF đồng loạt */}
      {batchRenderReport && batchReportKind && (
        <>
          {batchReportKind.type === 'hybrid' ? (
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
          ) : batchReportKind.type === 'allergen' ? (
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
              testPackages={testPackages}
            />
          )}

          {activeTemplate && renderDynamicReport && (
            renderDynamicReport({
              elementId: PRINT_ELEMENT_ID.BATCH_DYNAMIC,
              template: activeTemplate,
              clinicInfo,
              patient: batchRenderReport.patient,
              selectedTests: batchRenderReport.selectedTests,
              doctorName: batchRenderReport.doctorName,
              conclusion: batchRenderReport.conclusion,
              qrCodeDataUrl: undefined,
              testPackages,
              equipments,
              catalogItemEquipments,
              allergenScales
            })
          )}
        </>
      )}
    </div>
  );
}
