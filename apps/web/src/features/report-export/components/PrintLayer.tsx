import { useState, useEffect, useMemo } from 'react';
import PrintReportView from './PrintReportView';
import FullAllergenReportView from './FullAllergenReportView';
import HybridReportView from './HybridReportView';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { PRINT_ELEMENT_ID } from '@domain/constants';
import { ReportKindResolver } from '@domain/valueObjects/ReportKind';
import { generateQrCodeDataUrl, buildPortalUrl } from '@infra/qrService';
import type { ClinicInfo, MedicalReport, TestPackage, TestEquipment, CatalogItemEquipmentLink, AllergenGradingScale, ReportTemplate } from '@domain';
import type { DynamicReportRenderProps } from '../types';

// ─── PRINT LAYER COMPONENT ──────────────────────────────────────────────────
// Hidden off-screen DOM elements for pixel-perfect A4 printing & PDF capture.

interface PrintLayerProps {
  clinicInfo: ClinicInfo;
  qrCodeDataUrl?: string;
  previewTargetReport?: MedicalReport | null;
  batchRenderReport: MedicalReport | null;
  testPackages?: TestPackage[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  allergenScales?: AllergenGradingScale[];
  activeTemplate?: ReportTemplate;
  previewSelectedTemplate?: ReportTemplate | null;
  renderDynamicReport?: (props: DynamicReportRenderProps) => React.ReactNode;
}

export function PrintLayer({
  clinicInfo,
  qrCodeDataUrl,
  previewTargetReport,
  batchRenderReport,
  testPackages = [],
  equipments = [],
  catalogItemEquipments = [],
  allergenScales = [],
  activeTemplate,
  previewSelectedTemplate,
  renderDynamicReport
}: PrintLayerProps) {
  // Nếu preview chỉ định rõ null (chế độ Tự Động): tuyệt đối không fallback về activeTemplate
  const effectiveTemplate = previewSelectedTemplate !== undefined
    ? previewSelectedTemplate
    : (activeTemplate && !activeTemplate.isDefault ? activeTemplate : null);
  const {
    patient,
    selectedTests,
    conclusion,
    doctorName,
    invoices,
    currentReportId
  } = useWorkspace();

  const targetRep = previewTargetReport;
  const rawPatient = targetRep ? targetRep.patient : patient;
  const targetReportId = targetRep?.id || currentReportId;

  // Resolve matching invoice for SSOT payment determination
  const matchingInvoice = useMemo(() => {
    return invoices.find(
      (inv) =>
        (targetRep && (inv.reportId === targetRep.id || (targetRep.invoiceId && inv.id === targetRep.invoiceId))) ||
        (targetReportId && inv.reportId === targetReportId) ||
        (rawPatient?.code && inv.patientCode === rawPatient.code) ||
        (rawPatient?.sampleCode && inv.patientCode === rawPatient.sampleCode)
    );
  }, [invoices, targetRep, targetReportId, rawPatient?.code, rawPatient?.sampleCode]);

  const isInvoicePaid = Boolean(matchingInvoice && matchingInvoice.status === 'Đã thanh toán');
  const effectivePaidAt = rawPatient?.paidAt || (isInvoicePaid ? (matchingInvoice?.paidAt || matchingInvoice?.createdAt || new Date().toISOString()) : undefined);

  const effectivePatient = useMemo(() => {
    if (!rawPatient) return rawPatient;
    return {
      ...rawPatient,
      paidAt: effectivePaidAt
    };
  }, [rawPatient, effectivePaidAt]);

  // Also resolve matching invoice for batchRenderReport if present
  const batchMatchingInvoice = useMemo(() => {
    if (!batchRenderReport) return null;
    return invoices.find(
      (inv) =>
        inv.reportId === batchRenderReport.id ||
        (batchRenderReport.invoiceId && inv.id === batchRenderReport.invoiceId) ||
        (batchRenderReport.code && inv.patientCode === batchRenderReport.code) ||
        (batchRenderReport.patient?.code && inv.patientCode === batchRenderReport.patient.code)
    );
  }, [invoices, batchRenderReport]);

  const effectiveBatchPatient = useMemo(() => {
    if (!batchRenderReport) return null;
    const isBatchPaid = Boolean(batchMatchingInvoice && batchMatchingInvoice.status === 'Đã thanh toán');
    const resolvedBatchPaidAt = batchRenderReport.patient?.paidAt || (isBatchPaid ? (batchMatchingInvoice?.paidAt || batchMatchingInvoice?.createdAt || new Date().toISOString()) : undefined);
    return {
      ...batchRenderReport.patient,
      paidAt: resolvedBatchPaidAt
    };
  }, [batchRenderReport, batchMatchingInvoice]);

  const effectiveSelectedTests = previewTargetReport ? previewTargetReport.selectedTests : selectedTests;
  const effectiveConclusion = previewTargetReport ? (previewTargetReport.conclusion || '') : conclusion;
  const effectiveDoctorName = previewTargetReport ? (previewTargetReport.doctorName || '') : doctorName;
  const effectiveQrCode = previewTargetReport ? previewTargetReport.qrCodeDataUrl : qrCodeDataUrl;

  const [fallbackQrCode, setFallbackQrCode] = useState<string>('');
  const [batchFallbackQrCode, setBatchFallbackQrCode] = useState<string>('');

  useEffect(() => {
    if (effectiveQrCode) return;
    const code = effectivePatient?.code || effectivePatient?.sampleCode || 'BN-GOLAB';
    const portalUrl = buildPortalUrl(code, clinicInfo?.website);
    generateQrCodeDataUrl(portalUrl).then((res) => {
      if (res) setFallbackQrCode(res);
    });
  }, [effectiveQrCode, effectivePatient?.code, effectivePatient?.sampleCode, clinicInfo?.website]);

  useEffect(() => {
    if (!batchRenderReport || batchRenderReport.qrCodeDataUrl) return;
    const code = batchRenderReport.patient?.code || batchRenderReport.patient?.sampleCode || 'BN-GOLAB';
    const portalUrl = buildPortalUrl(code, clinicInfo?.website);
    generateQrCodeDataUrl(portalUrl).then((res) => {
      if (res) setBatchFallbackQrCode(res);
    });
  }, [batchRenderReport, clinicInfo?.website]);

  const resolvedQrCode = effectiveQrCode || fallbackQrCode;
  const resolvedBatchQrCode = batchRenderReport?.qrCodeDataUrl || batchFallbackQrCode;

  const reportKind = ReportKindResolver.resolve(effectiveSelectedTests);
  const batchReportKind = batchRenderReport
    ? ReportKindResolver.resolve(batchRenderReport.selectedTests, { isBatch: true })
    : null;

  return (
    <div
      className="print-layer-container fixed -left-[9999px] top-0 pointer-events-none overflow-hidden"
      style={{ width: '210mm', minWidth: '210mm', maxWidth: '210mm', opacity: 1, zIndex: -100 }}
    >
      {reportKind.type === 'hybrid' ? (
        <HybridReportView
          elementId={PRINT_ELEMENT_ID.HYBRID_REPORT}
          clinicInfo={clinicInfo}
          patient={effectivePatient}
          selectedTests={effectiveSelectedTests}
          doctorName={effectiveDoctorName}
          conclusion={effectiveConclusion}
          qrCodeDataUrl={resolvedQrCode}
          testPackages={testPackages}
          allergenScales={allergenScales}
          equipments={equipments}
          catalogItemEquipments={catalogItemEquipments}
        />
      ) : reportKind.type === 'allergen' ? (
        <FullAllergenReportView
          elementId={PRINT_ELEMENT_ID.ALLERGEN_REPORT}
          clinicInfo={clinicInfo}
          patient={effectivePatient}
          selectedTests={effectiveSelectedTests}
          doctorName={effectiveDoctorName}
          conclusion={effectiveConclusion}
          qrCodeDataUrl={resolvedQrCode}
          testPackages={testPackages}
          allergenScales={allergenScales}
          equipments={equipments}
          catalogItemEquipments={catalogItemEquipments}
        />
      ) : (
        <PrintReportView
          elementId={PRINT_ELEMENT_ID.MEDICAL_REPORT}
          clinicInfo={clinicInfo}
          patient={effectivePatient}
          selectedTests={effectiveSelectedTests}
          conclusion={effectiveConclusion}
          doctorName={effectiveDoctorName}
          qrCodeDataUrl={resolvedQrCode}
          equipments={equipments}
          catalogItemEquipments={catalogItemEquipments}
          testPackages={testPackages}
        />
      )}

      {/* RENDER BẢN MẪU ĐỘNG THEO TEMPLATE BUILDER (CHO XUẤT PDF & IN ẤN ĐỘNG) */}
      {effectiveTemplate && renderDynamicReport && (
        renderDynamicReport({
          elementId: PRINT_ELEMENT_ID.DYNAMIC_REPORT,
          template: effectiveTemplate,
          clinicInfo,
          patient: effectivePatient,
          selectedTests: effectiveSelectedTests,
          conclusion: effectiveConclusion,
          doctorName: effectiveDoctorName,
          qrCodeDataUrl: resolvedQrCode,
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
              patient={effectiveBatchPatient || batchRenderReport.patient}
              selectedTests={batchRenderReport.selectedTests}
              doctorName={batchRenderReport.doctorName}
              conclusion={batchRenderReport.conclusion}
              qrCodeDataUrl={resolvedBatchQrCode}
              testPackages={testPackages}
              allergenScales={allergenScales}
              equipments={equipments}
              catalogItemEquipments={catalogItemEquipments}
            />
          ) : batchReportKind.type === 'allergen' ? (
            <FullAllergenReportView
              elementId={PRINT_ELEMENT_ID.BATCH_ALLERGEN}
              clinicInfo={clinicInfo}
              patient={effectiveBatchPatient || batchRenderReport.patient}
              selectedTests={batchRenderReport.selectedTests}
              doctorName={batchRenderReport.doctorName}
              conclusion={batchRenderReport.conclusion}
              qrCodeDataUrl={resolvedBatchQrCode}
              testPackages={testPackages}
              allergenScales={allergenScales}
              equipments={equipments}
              catalogItemEquipments={catalogItemEquipments}
            />
          ) : (
            <PrintReportView
              elementId={PRINT_ELEMENT_ID.BATCH_MEDICAL}
              clinicInfo={clinicInfo}
              patient={effectiveBatchPatient || batchRenderReport.patient}
              selectedTests={batchRenderReport.selectedTests}
              conclusion={batchRenderReport.conclusion}
              doctorName={batchRenderReport.doctorName}
              qrCodeDataUrl={resolvedBatchQrCode}
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
              patient: effectiveBatchPatient || batchRenderReport.patient,
              selectedTests: batchRenderReport.selectedTests,
              doctorName: batchRenderReport.doctorName,
              conclusion: batchRenderReport.conclusion,
              qrCodeDataUrl: resolvedBatchQrCode,
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
