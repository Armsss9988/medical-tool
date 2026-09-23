// @vitest-environment jsdom
import { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PatientForm from '../PatientForm';
import { Patient, Doctor } from '@domain/types';

describe('PatientForm - Logic, State & Behavior with @testing-library/user-event', () => {
  afterEach(() => {
    cleanup();
  });

  const mockDoctors: Doctor[] = [
    { id: 'doc-1', name: 'BS. Trần Hoài Long', specialty: 'Xét nghiệm' },
    { id: 'doc-2', name: 'BS. Nguyễn Văn An', specialty: 'Nội khoa' }
  ];

  const defaultPatient: Patient = {
    code: 'BN-20260913-001',
    name: '',
    dob: '',
    gender: 'Nam',
    phone: '',
    address: '',
    diagnosis: '',
    secretToken: 'token-123',
    doctor: 'BS. Trần Hoài Long'
  };

  /**
   * Stateful Wrapper mô phỏng chính xác hành vi controlled component trong ứng dụng thực tế
   */
  function ControlledPatientForm(props: {
    initialPatient?: Partial<Patient>;
    onPatientChange?: (field: keyof Patient, value: unknown) => void;
    onGenerateNewCode?: () => void;
    setDoctorName?: (name: string) => void;
    isPaid?: boolean;
    onResetAll?: () => void;
  }) {
    const [patient, setPatient] = useState<Patient>({
      ...defaultPatient,
      ...props.initialPatient
    });

    return (
      <PatientForm
        patient={patient}
        onPatientChange={(field, value) => {
          setPatient((prev) => ({ ...prev, [field]: value }));
          props.onPatientChange?.(field, value);
        }}
        onGenerateNewCode={props.onGenerateNewCode}
        doctorsList={mockDoctors}
        setDoctorName={props.setDoctorName}
        isPaid={props.isPaid ?? false}
        onResetAll={props.onResetAll}
      />
    );
  }

  it('1. BEHAVIOUR & LOGIC: Typing patient name automatically converts to UPPERCASE in state & input', async () => {
    const user = userEvent.setup();
    const onPatientChange = vi.fn();

    render(<ControlledPatientForm onPatientChange={onPatientChange} />);

    const nameInput = screen.getByPlaceholderText(/VÍ DỤ: HOÀNG BẢO NGỌC/i) as HTMLInputElement;
    await user.type(nameInput, 'nguyen thi hoa');

    // Mọi ký tự gõ vào đều được uppercase đúng logic y tế
    expect(onPatientChange).toHaveBeenCalledWith('name', 'N');
    expect(onPatientChange).toHaveBeenLastCalledWith('name', 'NGUYEN THI HOA');
    expect(nameInput.value).toBe('NGUYEN THI HOA');
  });

  it('2. BEHAVIOUR & LOGIC: Typing into DOB input dynamically computes Smart Age badge', async () => {
    const user = userEvent.setup();
    const currentYear = new Date().getFullYear();

    render(<ControlledPatientForm />);
    const dobInput = screen.getByPlaceholderText(/1992 hoặc 22\/06\/1992/i);

    // 1. Nhập năm sinh 4 chữ số: "1995"
    await user.type(dobInput, '1995');
    expect(screen.getByText(`${currentYear - 1995} tuổi`)).toBeTruthy();

    // 2. Xóa và nhập định dạng ngày tháng năm: "20/11/2000"
    await user.clear(dobInput);
    await user.type(dobInput, '20/11/2000');
    expect(screen.getByText(`${currentYear - 2000} tuổi`)).toBeTruthy();

    // 3. Xóa và nhập trực tiếp số tuổi: "42"
    await user.clear(dobInput);
    await user.type(dobInput, '42');
    expect(screen.getByText('42 tuổi')).toBeTruthy();

    // 4. Nhập 8 chữ số liên tiếp trên bàn phím số (mobile): "08121994" -> tự động chuyển thành "08/12/1994"
    await user.clear(dobInput);
    await user.type(dobInput, '08121994');
    expect((dobInput as HTMLInputElement).value).toBe('08/12/1994');
    expect(screen.getByText(`${currentYear - 1994} tuổi`)).toBeTruthy();

    // 5. Nhập 7 chữ số dạng DDMYYYY: "1551994" (ngày 15, tháng 5) -> onBlur chuyển thành "15/05/1994" (không bị thành tháng 55)
    await user.clear(dobInput);
    await user.type(dobInput, '1551994');
    await user.tab();
    expect((dobInput as HTMLInputElement).value).toBe('15/05/1994');
    expect(screen.getByText(`${currentYear - 1994} tuổi`)).toBeTruthy();

    // 6. Nhập 7 chữ số dạng DMMYYYY: "8121994" (ngày 8, tháng 12) -> onBlur chuyển thành "08/12/1994"
    await user.clear(dobInput);
    await user.type(dobInput, '8121994');
    await user.tab();
    expect((dobInput as HTMLInputElement).value).toBe('08/12/1994');

    // 7. Nhập nhầm 8 chữ số không phải ngày tháng (VD đầu số điện thoại "09836336"): không bị tự động ép thành ngày dị dạng
    await user.clear(dobInput);
    await user.type(dobInput, '09836336');
    expect((dobInput as HTMLInputElement).value).toBe('09836336');
  });

  it('3. BEHAVIOUR & STATE: Switching gender via segmented buttons updates active styling & state', async () => {
    const user = userEvent.setup();
    const onPatientChange = vi.fn();

    render(<ControlledPatientForm initialPatient={{ gender: 'Nam' }} onPatientChange={onPatientChange} />);

    const femaleBtn = screen.getByRole('button', { name: 'Nữ' });
    await user.click(femaleBtn);

    expect(onPatientChange).toHaveBeenCalledTimes(1);
    expect(onPatientChange).toHaveBeenCalledWith('gender', 'Nữ');
  });

  it('4. BEHAVIOUR: Fast-Entry Keyboard Enter chaining (Name -> DOB -> Phone -> Address)', async () => {
    const user = userEvent.setup();

    render(<ControlledPatientForm />);

    const nameInput = screen.getByPlaceholderText(/VÍ DỤ: HOÀNG BẢO NGỌC/i);
    const dobInput = screen.getByPlaceholderText(/1992 hoặc 22\/06\/1992/i);
    const phoneInput = screen.getByPlaceholderText(/098 3633677/i);
    const addressInput = screen.getByPlaceholderText(/Cổng BV-VNCB-ĐH/i);

    // 1. Click vào Name input, gõ tên rồi nhấn Enter
    await user.click(nameInput);
    await user.keyboard('TRAN VAN NAM{Enter}');

    // Focus phải tự động chuyển sang DOB input
    expect(document.activeElement).toBe(dobInput);

    // 2. Nhấn Enter tại DOB input
    await user.keyboard('1988{Enter}');
    // Focus chuyển sang Phone input
    expect(document.activeElement).toBe(phoneInput);

    // 3. Nhấn Enter tại Phone input
    await user.keyboard('0912345678{Enter}');
    // Focus chuyển sang Address input
    expect(document.activeElement).toBe(addressInput);
  });

  it('5. STATE & BEHAVIOUR: Expand collapsible time fields and fill timestamps safely', async () => {
    const user = userEvent.setup();
    const onPatientChange = vi.fn();

    render(<ControlledPatientForm onPatientChange={onPatientChange} isPaid={false} />);

    // Ban đầu mục thời gian bị thu gọn
    expect(screen.queryByText(/Quy trình mẫu & Dấu mốc thời gian/i)).toBeNull();

    // Click nút mở rộng
    const toggleBtn = screen.getByRole('button', { name: /T\/G & Quy Trình Mẫu/i });
    await user.click(toggleBtn);

    // Hiện ra giao diện chi tiết thời gian
    expect(screen.getByText(/Quy trình mẫu & Dấu mốc thời gian/i)).toBeTruthy();

    // Click nút "Điền giờ hiện tại cho tất cả"
    const fillAllBtn = screen.getByRole('button', { name: /Điền giờ hiện tại cho tất cả/i });
    await user.click(fillAllBtn);

    // Kiểm tra các mốc thời gian y tế được cập nhật
    expect(onPatientChange).toHaveBeenCalledWith('orderedAt', expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/));
    expect(onPatientChange).toHaveBeenCalledWith('receivedAt', expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/));
    expect(onPatientChange).toHaveBeenCalledWith('returnedAt', expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/));

    // Vì isPaid = false, tuyệt đối KHÔNG tự ý đánh dấu paidAt (bảo vệ nguyên tắc SSOT tài chính)
    expect(onPatientChange).not.toHaveBeenCalledWith('paidAt', expect.anything());
  });

  it('6. BEHAVIOUR: Generates new sample code when clicking refresh button', async () => {
    const user = userEvent.setup();
    const onGenerateNewCode = vi.fn();

    render(<ControlledPatientForm onGenerateNewCode={onGenerateNewCode} />);

    const refreshCodeBtn = screen.getByRole('button', { name: /Mã mới/i });
    await user.click(refreshCodeBtn);

    expect(onGenerateNewCode).toHaveBeenCalledTimes(1);
  });

  it('7. STATE & LOGIC: Doctor dropdown selection triggers state change', async () => {
    const user = userEvent.setup();
    const onPatientChange = vi.fn();
    const setDoctorName = vi.fn();

    render(
      <ControlledPatientForm
        onPatientChange={onPatientChange}
        setDoctorName={setDoctorName}
      />
    );

    const doctorSelect = screen.getByRole('combobox') as HTMLSelectElement;
    await user.selectOptions(doctorSelect, 'BS. Nguyễn Văn An');

    expect(onPatientChange).toHaveBeenCalledWith('doctor', 'BS. Nguyễn Văn An');
    expect(setDoctorName).toHaveBeenCalledWith('BS. Nguyễn Văn An');
    expect(doctorSelect.value).toBe('BS. Nguyễn Văn An');
  });

  it('8. BEHAVIOUR: + Ca Mới button renders and triggers onResetAll', async () => {
    const user = userEvent.setup();
    const onResetAll = vi.fn();

    render(<ControlledPatientForm onResetAll={onResetAll} />);

    const resetBtn = screen.getByRole('button', { name: /\+ Ca Mới/i });
    expect(resetBtn).toBeDefined();

    await user.click(resetBtn);
    expect(onResetAll).toHaveBeenCalledTimes(1);
  });
});
