import { describe, it, expect } from 'vitest';
import { Result } from '../utils/Result';
import {
  DocumentStateNode,
  DraftStateNode,
  ResultedStateNode,
  ExportedStateNode,
  OutdatedStateNode,
  DeliveredStateNode,
  ReportDocumentState
} from '../valueObjects/ReportDocumentState';
import { LabReportAggregate } from '../aggregates/LabReportAggregate';
import { SelectedTest, Patient } from '../types';

describe('Result Pattern Utility', () => {
  it('should create success Result with value', () => {
    const res = Result.ok(42);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe(42);
    }
  });

  it('should create failure Result with error', () => {
    const res = Result.fail('Validation failed');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe('Validation failed');
    }
  });
});

describe('DocumentStateNode - GoF State Pattern with Default Fallback', () => {
  describe('DraftStateNode', () => {
    const draft = new DraftStateNode(3, 0, false);

    it('should have correct capability flags', () => {
      expect(draft.status).toBe('DRAFT');
      expect(draft.canExportPdf).toBe(false);
      expect(draft.canSendZalo).toBe(false);
      expect(draft.canModifyTests).toBe(true);
    });

    it('should fail when trying to export PDF or send Zalo', () => {
      const exportRes = draft.exportPdf('https://cloud.com/report.pdf');
      expect(exportRes.ok).toBe(false);
      if (!exportRes.ok) {
        expect(exportRes.error).toContain('Chờ xét nghiệm');
      }

      const zaloRes = draft.sendZalo('Zalo');
      expect(zaloRes.ok).toBe(false);
    });

    it('should transition to ResultedStateNode when results are entered', () => {
      const res = draft.modifyTests(true, 1, 3);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.status).toBe('RESULTED');
        expect(res.value.canExportPdf).toBe(true);
      }
    });

    it('should stay in DraftStateNode when no results are entered', () => {
      const res = draft.modifyTests(false, 0, 3);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.status).toBe('DRAFT');
      }
    });

    it('should serialize to snapshot accurately', () => {
      const snapshot = draft.toSnapshot();
      expect(snapshot).toEqual({
        status: 'DRAFT',
        totalTests: 3,
        completedTests: 0,
        hasAnyResult: false
      });
    });
  });

  describe('ResultedStateNode', () => {
    const resulted = new ResultedStateNode(3, 3, '2026-09-06T10:00:00Z');

    it('should have correct capability flags', () => {
      expect(resulted.status).toBe('RESULTED');
      expect(resulted.canExportPdf).toBe(true);
      expect(resulted.canSendZalo).toBe(false);
      expect(resulted.canModifyTests).toBe(true);
    });

    it('should successfully transition to ExportedStateNode when exporting PDF', () => {
      const res = resulted.exportPdf('https://supabase.co/storage/lab-001.pdf', 'data:image/png;base64,qr');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.status).toBe('EXPORTED');
        const exportedNode = res.value as ExportedStateNode;
        expect(exportedNode.cloudPdfUrl).toBe('https://supabase.co/storage/lab-001.pdf');
        expect(exportedNode.pdfVersion).toBe(1);
        expect(exportedNode.canSendZalo).toBe(true);
      }
    });

    it('should fail export when cloud URL is missing', () => {
      const res = resulted.exportPdf('');
      expect(res.ok).toBe(false);
    });

    it('should fail sending Zalo before export', () => {
      const res = resulted.sendZalo('Zalo');
      expect(res.ok).toBe(false);
    });
  });

  describe('ExportedStateNode', () => {
    const exported = new ExportedStateNode(
      'https://supabase.co/storage/lab-001.pdf',
      'data:image/png;base64,qr',
      1,
      '2026-09-06T10:05:00Z'
    );

    it('should have correct capability flags', () => {
      expect(exported.status).toBe('EXPORTED');
      expect(exported.canExportPdf).toBe(false);
      expect(exported.canSendZalo).toBe(true);
      expect(exported.canModifyTests).toBe(true);
    });

    it('should transition to DeliveredStateNode when sending Zalo', () => {
      const res = exported.sendZalo('Zalo', 'msg-12345');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.status).toBe('DELIVERED');
        const deliveredNode = res.value as DeliveredStateNode;
        expect(deliveredNode.msgId).toBe('msg-12345');
        expect(deliveredNode.channel).toBe('Zalo');
      }
    });

    it('should automatically transition to OutdatedStateNode when modifying tests', () => {
      const res = exported.modifyTests(true, 3, 3);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.status).toBe('OUTDATED');
        expect(res.value.canExportPdf).toBe(true);
        const outdatedNode = res.value as OutdatedStateNode;
        expect(outdatedNode.previousPdfUrl).toBe('https://supabase.co/storage/lab-001.pdf');
        expect(outdatedNode.dirtyReasons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('OutdatedStateNode', () => {
    const outdated = new OutdatedStateNode(
      'https://supabase.co/storage/lab-001.pdf',
      'data:image/png;base64,qr',
      1,
      '2026-09-06T10:05:00Z',
      ['Kết quả xét nghiệm thay đổi']
    );

    it('should allow re-exporting PDF with incremented version', () => {
      expect(outdated.canExportPdf).toBe(true);
      expect(outdated.canSendZalo).toBe(false);

      const res = outdated.exportPdf('https://supabase.co/storage/lab-001-v2.pdf');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.status).toBe('EXPORTED');
        const exportedNode = res.value as ExportedStateNode;
        expect(exportedNode.pdfVersion).toBe(2);
        expect(exportedNode.cloudPdfUrl).toBe('https://supabase.co/storage/lab-001-v2.pdf');
      }
    });
  });

  describe('DeliveredStateNode', () => {
    const delivered = new DeliveredStateNode(
      'https://supabase.co/storage/lab-001.pdf',
      '2026-09-06T10:15:00Z',
      'Zalo',
      'data:image/png;base64,qr',
      'msg-123'
    );

    it('should allow re-sending via Zalo and flag outdated on data modification', () => {
      expect(delivered.canSendZalo).toBe(true);
      expect(delivered.canExportPdf).toBe(false);

      const reSendRes = delivered.sendZalo('Zalo', 'msg-456');
      expect(reSendRes.ok).toBe(true);

      const modRes = delivered.modifyTests(true, 3, 3);
      expect(modRes.ok).toBe(true);
      if (modRes.ok) {
        expect(modRes.value.status).toBe('OUTDATED');
      }
    });
  });

  describe('fromSnapshot roundtrip', () => {
    const snapshots: ReportDocumentState[] = [
      { status: 'DRAFT', totalTests: 2, completedTests: 0, hasAnyResult: false },
      { status: 'RESULTED', totalTests: 2, completedTests: 2, resultedAt: '2026-09-06T10:00:00Z' },
      { status: 'EXPORTED', cloudPdfUrl: 'https://cdn/p.pdf', qrCodeDataUrl: 'qr', pdfVersion: 1, exportedAt: '2026-09-06T10:05:00Z' },
      { status: 'OUTDATED', previousPdfUrl: 'https://cdn/p.pdf', qrCodeDataUrl: 'qr', pdfVersion: 1, lastExportedAt: '2026-09-06T10:05:00Z', dirtyReasons: ['changed'] },
      { status: 'DELIVERED', cloudPdfUrl: 'https://cdn/p.pdf', deliveredAt: '2026-09-06T10:10:00Z', channel: 'Zalo', qrCodeDataUrl: 'qr', msgId: 'm1' }
    ];

    it('should roundtrip all states from and to snapshot seamlessly', () => {
      for (const snap of snapshots) {
        const node = DocumentStateNode.fromSnapshot(snap);
        expect(node.status).toBe(snap.status);
        expect(node.toSnapshot()).toEqual(snap);
      }
    });
  });
});

describe('LabReportAggregate - Guarded State Machine Transitions', () => {
  const sampleTest: SelectedTest = {
    code: 'GLU',
    name: 'Glucose máu',
    category: 'Sinh Hóa Máu',
    unit: 'mmol/L',
    refText: '4.1 - 5.9',
    result: '5.2',
    note: 'Bình thường'
  };

  const draftTest: SelectedTest = {
    code: 'GLU',
    name: 'Glucose',
    category: 'Sinh Hóa Máu',
    unit: 'mmol/L',
    refText: '4.1 - 5.9',
    result: '', // Chưa có kết quả
    note: ''
  };

  const samplePatient: Patient = {
    code: 'BN-DRAFT-001',
    secretToken: 'TOK-DRAFT-001',
    name: 'Trần Văn B',
    dob: '1990',
    gender: 'Nam',
    phone: '0912345678',
    address: 'Hà Nội',
    diagnosis: 'Khám sức khỏe'
  };

  it('should guard PDF export when report is in DRAFT status', () => {
    const draftReport = LabReportAggregate.create({
      code: 'BN-DRAFT-001',
      patient: samplePatient,
      doctorName: 'BS. Trung',
      selectedTests: [draftTest]
    });

    expect(draftReport.documentState.status).toBe('DRAFT');
    expect(draftReport.canExportPdf).toBe(false);
    expect(draftReport.canSendZalo).toBe(false);

    // Guarded transition attempt
    const res = draftReport.tryExportPdf('https://cloud/report.pdf');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('chưa đủ điều kiện');
    }
  });

  it('should execute PDF export guarded transition when report is in RESULTED status', () => {
    const report = LabReportAggregate.create({
      code: 'BN-RES-001',
      patient: { ...samplePatient, code: 'BN-RES-001', name: 'Lê Văn C' },
      doctorName: 'BS. Trung',
      selectedTests: [sampleTest]
    });

    expect(report.documentState.status).toBe('RESULTED');
    expect(report.canExportPdf).toBe(true);

    const exportRes = report.tryExportPdf('https://cloud/report-res.pdf', 'data:qr');
    expect(exportRes.ok).toBe(true);
    expect(report.documentState.status).toBe('EXPORTED');
    expect(report.cloudPdfUrl).toBe('https://cloud/report-res.pdf');
    expect(report.canSendZalo).toBe(true);

    // Giờ gửi Zalo sẽ thành công
    const zaloRes = report.trySendZalo('Zalo', 'msg-999');
    expect(zaloRes.ok).toBe(true);
    expect(report.documentState.status).toBe('DELIVERED');
  });
});
