import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PatientForm from '../PatientForm';
import { MainWorkspace } from '../../../../components/MainWorkspace';
import { invoiceSchema, safeParseInvoices } from '@golab/shared/schemas/invoiceSchemas';
import type { Patient, Doctor } from '@domain';

// Mock Workspace Context for MainWorkspace test
vi.mock('../../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    patient: {
      name: 'TRẦN THỊ HỒNG',
      code: 'BN-001',
      dob: '1995',
      gender: 'Nữ',
      phone: '0901234567',
      address: 'Đồng Hới, Quảng Bình'
    },
    setPatient: vi.fn(),
    selectedTests: [{ code: 'GLU', name: 'Glucose', price: 50000 }],
    setSelectedTests: vi.fn(),
    conclusion: 'Bình thường',
    setConclusion: vi.fn(),
    doctorName: 'BS. Long',
    setDoctorName: vi.fn(),
    currentReportId: 'rep-001',
    setCurrentReportId: vi.fn(),
    currentLoadedReport: null,
    reports: [],
    recentTests: [],
    addToRecent: vi.fn(),
    addMultipleToRecent: vi.fn(),
    nameInputRef: { current: null },
    autoFocusName: false,
    generateNewPatientCode: () => 'BN-002'
  })
}));

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('Mobile Workflow & DOB Fixes Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPatient: Patient = {
    name: 'NGUYỄN VĂN AN',
    code: 'BN-20260924-001',
    dob: '',
    gender: 'Nam',
    phone: '0912345678',
    address: '123 Lý Thái Tổ, Đồng Hới, Quảng Bình',
    diagnosis: '',
    secretToken: ''
  };

  const mockDoctors: Doctor[] = [
    { id: 'doc-1', name: 'BS. Trần Hoài Long', specialty: 'Bác sĩ chuyên khoa' }
  ];

  it('1. DOB input should use inputMode="text" and provide a quick "/" button', () => {
    const onPatientChange = vi.fn();

    render(
      <PatientForm
        patient={mockPatient}
        onPatientChange={onPatientChange}
        doctorsList={mockDoctors}
      />
    );

    const dobInput = screen.getByPlaceholderText(/1992 hoặc 22\/06\/1992/i);
    expect(dobInput).toBeDefined();
    expect(dobInput.getAttribute('inputMode')).toBe('text');

    const slashButton = screen.getByTitle(/chèn nhanh dấu gạch chéo/i);
    expect(slashButton).toBeDefined();

    fireEvent.click(slashButton);
    expect(onPatientChange).toHaveBeenCalledWith('dob', '/');
  });

  it('2. DOB input auto-formats 8 continuous digits (08121994) to DD/MM/YYYY', () => {
    const onPatientChange = vi.fn();

    render(
      <PatientForm
        patient={mockPatient}
        onPatientChange={onPatientChange}
        doctorsList={mockDoctors}
      />
    );

    const dobInput = screen.getByPlaceholderText(/1992 hoặc 22\/06\/1992/i);

    fireEvent.change(dobInput, { target: { value: '08121994' } });
    expect(onPatientChange).toHaveBeenCalledWith('dob', '08/12/1994');
  });

  it('3. DOB input auto-inserts "/" when typing day and month progressively', () => {
    const onPatientChange = vi.fn();

    render(
      <PatientForm
        patient={mockPatient}
        onPatientChange={onPatientChange}
        doctorsList={mockDoctors}
      />
    );

    const dobInput = screen.getByPlaceholderText(/1992 hoặc 22\/06\/1992/i);

    // Typing with . or - or space auto converts to /
    fireEvent.change(dobInput, { target: { value: '08.12.1994' } });
    expect(onPatientChange).toHaveBeenCalledWith('dob', '08/12/1994');
  });

  it('4. PatientForm header renders prominent "+ Ca Mới" button that calls onResetAll', () => {
    const onResetAll = vi.fn();

    render(
      <PatientForm
        patient={mockPatient}
        onResetAll={onResetAll}
        doctorsList={mockDoctors}
        editingReportCode="BN-001"
      />
    );

    const newCaseButtons = screen.getAllByRole('button', { name: /\+ Ca Mới/i });
    expect(newCaseButtons.length).toBeGreaterThan(0);

    fireEvent.click(newCaseButtons[0]);
    expect(onResetAll).toHaveBeenCalledTimes(1);

    // Also verify switch to new case button in the editing badge
    const switchButton = screen.getByTitle(/Không muốn sửa ca cũ\? Bấm để tạo ca mới/i);
    expect(switchButton).toBeDefined();
    fireEvent.click(switchButton);
    expect(onResetAll).toHaveBeenCalledTimes(2);
  });

  it('5. MainWorkspace mobile bottom sticky bar contains "+ Ca Mới" button', () => {
    const onResetAll = vi.fn();
    const onOpenInvoiceModal = vi.fn();
    const onOpenPreview = vi.fn();
    const onExportPdfAndUpload = vi.fn();

    render(
      <MainWorkspace
        catalog={[]}
        testPackages={[]}
        testGroups={[]}
        doctorsList={mockDoctors}
        cloudLink=""
        isExporting={false}
        currentStep={null}
        totalFee={150000}
        isCurrentPdfOutdated={false}
        isCurrentReportPaid={false}
        currentInvoiceForReport={null}
        onOpenDoctorModal={vi.fn()}
        onOpenPreview={onOpenPreview}
        onSaveReport={vi.fn()}
        onExportPdfAndUpload={onExportPdfAndUpload}
        onDownloadPdf={vi.fn()}
        onDirectSendZalo={vi.fn()}
        onOpenSendZaloModal={vi.fn()}
        onResetAll={onResetAll}
        onDownloadQrCode={vi.fn()}
        onOpenInvoiceModal={onOpenInvoiceModal}
      />
    );

    const mobileButtons = screen.getAllByRole('button', { name: /\+ Ca Mới/i });
    expect(mobileButtons.length).toBeGreaterThanOrEqual(2);

    // Both the PatientForm header and the mobile sticky bottom bar buttons trigger onResetAll
    fireEvent.click(mobileButtons[mobileButtons.length - 1]);
    expect(onResetAll).toHaveBeenCalledTimes(1);
  });

  it('6. invoiceSchema validates and preserves patientAddress, patientDob, and patientGender', () => {
    const rawInvoice = {
      id: 'inv-addr-test',
      code: 'HD-TEST-001',
      patientName: 'LÊ VĂN BÌNH',
      patientPhone: '0987654321',
      patientDob: '20/11/1990',
      patientGender: 'Nam',
      patientAddress: '456 Quang Trung, Đồng Hới',
      totalAmount: 100000,
      finalAmount: 100000,
      status: 'Đã thanh toán',
      items: [
        { code: 'CBC', name: 'Tổng phân tích tế bào máu', price: 100000, quantity: 1 }
      ]
    };

    const parsed = invoiceSchema.parse(rawInvoice);
    expect(parsed.patientAddress).toBe('456 Quang Trung, Đồng Hới');
    expect(parsed.patientDob).toBe('20/11/1990');
    expect(parsed.patientGender).toBe('Nam');

    const safeList = safeParseInvoices([rawInvoice]);
    expect(safeList.length).toBe(1);
    expect(safeList[0].patientAddress).toBe('456 Quang Trung, Đồng Hới');
  });
});
