import { useState, useMemo, useEffect } from 'react';
import {
  X, CreditCard, CheckCircle, Printer, Plus, Trash2, QrCode, Copy, Check,
  AlertCircle, Clock, CloudUpload, Download, Loader2, ExternalLink
} from 'lucide-react';
import { 
  Patient, SelectedTest, TestPackage, Doctor, Invoice, InvoiceItem, ClinicInfo, 
  PaymentMethod, BillingStatus, BILLING_STATUS, PAYMENT_METHOD, PAYMENT_METHOD_LIST 
} from '@domain';
import { buildInvoiceItems } from '@domain/pricing';
import { generateHighQualityPdf, downloadPdfDirectly } from '@infra/pdfService';
import { uploadPdfToCloudinary } from '@infra/cloudService';
import { useToast } from '../contexts/ToastContext';
import PrintReceiptView from './PrintReceiptView';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  selectedTests: SelectedTest[];
  currentPackageId?: string;
  testPackages?: TestPackage[];
  doctorsList?: Doctor[];
  doctorName?: string;
  clinicInfo?: ClinicInfo;
  currentReportId?: string | null;
  isReportSaved?: boolean;
  onSaveReportFirst?: () => string | null | void;
  onSaveInvoice: (newInvoice: Invoice) => void;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  patient,
  selectedTests,
  testPackages = [],
  doctorName,
  clinicInfo,
  currentReportId,
  isReportSaved = false,
  onSaveReportFirst,
  onSaveInvoice
}: InvoiceModalProps) {
  const { showToast } = useToast();

  const [items, setItems] = useState<InvoiceItem[]>(() => {
    return buildInvoiceItems(selectedTests, testPackages);
  });

  // 2. STATE PHỤ PHÍ & CHIẾT KHẤU
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0);
  const [surchargeNote, setSurchargeNote] = useState<string>('Phụ phí lấy mẫu tận nơi');
  const [showSurcharge, setShowSurcharge] = useState<boolean>(false);

  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountVal, setDiscountVal] = useState<number>(0);

  // 3. HÌNH THỨC THANH TOÁN & BÁC SĨ
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHOD.BANK_TRANSFER);
  const [selectedDoc, setSelectedDoc] = useState<string>(doctorName || 'BS. Trần Hoài Long');
  const [cashier, setCashier] = useState<string>(clinicInfo?.cashierName || 'Lê Phan Anh');
  const [invoiceNote, setInvoiceNote] = useState<string>('');

  // 4. STATE XUẤT PDF & CLOUD
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [cloudPdfUrl, setCloudPdfUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Cập nhật khi selectedTests hoặc testPackages thay đổi
  useEffect(() => {
    if (selectedTests.length > 0) {
      setItems(buildInvoiceItems(selectedTests, testPackages));
    }
  }, [selectedTests, testPackages]);

  useEffect(() => {
    if (doctorName) setSelectedDoc(doctorName);
  }, [doctorName]);

  // TÍNH TOÁN TỔNG TIỀN
  const rawSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  }, [items]);

  const totalWithSurcharge = useMemo(() => {
    return rawSubtotal + (showSurcharge ? surchargeAmount : 0);
  }, [rawSubtotal, showSurcharge, surchargeAmount]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round((totalWithSurcharge * (discountVal || 0)) / 100);
    }
    return Math.min(discountVal || 0, totalWithSurcharge);
  }, [discountType, discountVal, totalWithSurcharge]);

  const discountPercent = useMemo(() => {
    if (totalWithSurcharge <= 0) return 0;
    if (discountType === 'percent') return discountVal;
    return Math.round((calculatedDiscount / totalWithSurcharge) * 100);
  }, [discountType, discountVal, calculatedDiscount, totalWithSurcharge]);

  const finalAmount = useMemo(() => {
    return Math.max(0, totalWithSurcharge - calculatedDiscount);
  }, [totalWithSurcharge, calculatedDiscount]);

  // Sinh mã hóa đơn chuẩn
  const invoiceCode = useMemo(() => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const cleanPatientCode = (patient.code || 'BN001').replace(/^BN-?/, '');
    return `HD-${dateStr}-${cleanPatientCode}`;
  }, [patient.code]);

  // Cập nhật số lượng hoặc giá từng dòng
  const handleItemChange = <K extends keyof InvoiceItem>(idx: number, field: K, value: InvoiceItem[K]) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddCustomItem = () => {
    setItems((prev) => [
      ...prev,
      {
        code: `DV-${prev.length + 1}`,
        name: 'Dịch vụ / Xét nghiệm bổ sung',
        price: 50000,
        quantity: 1,
        unit: 'Lần'
      }
    ]);
  };

  // Cấu hình VietQR Napas 247
  const bankId = clinicInfo?.bankId || 'VBA';
  const bankAcc = clinicInfo?.bankAccountNo || '8888876781225';
  const bankAccName = clinicInfo?.bankAccountName || 'LE PHAN ANH';
  const transferContent = `${invoiceCode} ${(patient.name || '').replace(/[^a-zA-Z0-9\s]/g, '')}`.trim();

  const vietQrUrl = `https://img.vietqr.io/image/${bankId}-${bankAcc}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankAccName)}`;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const currentInvoice: Invoice = useMemo(() => ({
    id: `inv-${Date.now()}`,
    code: invoiceCode,
    patientCode: patient.code,
    patientName: patient.name,
    patientPhone: patient.phone,
    patientDob: patient.dob,
    patientGender: patient.gender,
    doctorName: selectedDoc,
    cashierName: cashier,
    items,
    totalAmount: rawSubtotal,
    surchargeAmount: showSurcharge ? surchargeAmount : 0,
    surchargeNote: showSurcharge ? surchargeNote : undefined,
    discountAmount: calculatedDiscount,
    discountPercent,
    finalAmount,
    paymentMethod,
    status: BILLING_STATUS.PAID,
    notes: invoiceNote,
    reportId: currentReportId || undefined,
    cloudPdfUrl: cloudPdfUrl || undefined,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }), [
    invoiceCode, patient, selectedDoc, cashier, items, rawSubtotal,
    showSurcharge, surchargeAmount, surchargeNote, calculatedDiscount,
    discountPercent, finalAmount, paymentMethod, invoiceNote,
    currentReportId, cloudPdfUrl
  ]);

  const pdfFilename = `PhieuThu_${(patient.name || 'BenhNhan').replace(/\s+/g, '_')}_${invoiceCode}.pdf`;

  // 1. ACTION: TẢI FILE PDF LOCAL VỀ MÁY TÍNH
  const handleDownloadPdfLocal = async () => {
    try {
      showToast('Đang tạo và tải file PDF Phiếu Thu về máy...', 'info');
      await downloadPdfDirectly('invoice-receipt-print-element', pdfFilename);
      showToast('Đã tải thành công file PDF Phiếu Thu về máy tính!', 'success');
    } catch (err) {
      console.error('Lỗi khi tải file PDF Phiếu Thu:', err);
      showToast('Không thể tạo file PDF Phiếu Thu. Vui lòng thử lại!', 'error');
    }
  };

  // 2. ACTION: XUẤT PDF & LƯU LÊN CLOUD STORAGE
  const handleExportPdfAndUploadCloud = async () => {
    try {
      setIsExportingPdf(true);
      showToast('Đang xuất PDF chất lượng cao và lưu lên Cloud...', 'info');

      const { base64 } = await generateHighQualityPdf('invoice-receipt-print-element', pdfFilename);
      const uploadRes = await uploadPdfToCloudinary({
        pdfBase64: base64,
        filename: pdfFilename
      });

      if (uploadRes?.url) {
        setCloudPdfUrl(uploadRes.url);
        showToast('Đã xuất PDF và lưu Cloud thành công! Đường link đã được kích hoạt.', 'success');
      } else {
        showToast('Không thể lưu PDF lên Cloud, vui lòng kiểm tra kết nối mạng!', 'warning');
      }
    } catch (err) {
      console.error('Lỗi khi xuất PDF và tải lên Cloud:', err);
      showToast('Có lỗi xảy ra khi lưu PDF lên Cloud.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. ACTION: IN TRỰC TIẾP
  const handlePrintDirect = () => {
    window.print();
  };

  // 4. ACTION: LƯU HÓA ĐƠN VÀO HỆ THỐNG
  const handleSaveWithStatus = (targetStatus: BillingStatus) => {
    let reportIdToLink = currentReportId;

    // Nếu phiếu chưa được lưu, tự động kích hoạt lưu phiếu xét nghiệm trước
    if (!reportIdToLink && onSaveReportFirst) {
      const savedId = onSaveReportFirst();
      if (!savedId) return;
      reportIdToLink = savedId;
    }

    if (!reportIdToLink) {
      alert("Hóa đơn không thể được lưu khi chưa lưu Phiếu Kết Quả Xét Nghiệm vào hệ thống!");
      return;
    }

    const isPaid = targetStatus === BILLING_STATUS.PAID;

    onSaveInvoice({
      ...currentInvoice,
      status: targetStatus,
      cloudPdfUrl: cloudPdfUrl || undefined,
      paidAt: isPaid ? new Date().toISOString() : undefined,
      reportId: reportIdToLink
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white sm:rounded-2xl shadow-2xl border border-slate-200 w-full h-full sm:h-[92vh] max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 shadow gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">Hóa Đơn Thu Phí & Thanh Toán</h3>
                <span className="font-mono text-[11px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/40">
                  {invoiceCode}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200/80">
                Bệnh nhân: <strong className="text-white uppercase">{patient.name || '---'}</strong> • Mã: <strong className="font-mono">{patient.code}</strong> • BS: {selectedDoc}
              </p>
            </div>
          </div>

          {/* QUICK ACTIONS TRONG HEADER */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Nút Tải PDF Local */}
            <button
              type="button"
              onClick={handleDownloadPdfLocal}
              disabled={isExportingPdf}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
              title="Tải trực tiếp file PDF Phiếu Thu về máy tính"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải PDF Local</span>
            </button>

            {/* Nút Xuất PDF & Lưu Cloud */}
            <button
              type="button"
              onClick={handleExportPdfAndUploadCloud}
              disabled={isExportingPdf}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
              title="Xuất file PDF chất lượng cao và lưu trữ an toàn trên Cloud"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? 'Đang Lưu Cloud...' : 'Xuất PDF & Lưu Cloud'}</span>
            </button>

            {/* Nút In Trực Tiếp */}
            <button
              type="button"
              onClick={handlePrintDirect}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs flex items-center space-x-1.5 transition active:scale-95"
              title="In phiếu thu trực tiếp ra máy in"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu Thu</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BANNER CẢNH BÁO NẾU PHIẾU CHƯA ĐƯỢC LƯU */}
        {!isReportSaved && !currentReportId && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center space-x-2 text-amber-900 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Lưu ý:</strong> Phiếu Xét Nghiệm của bệnh nhân <strong>chưa được lưu</strong> vào Sổ Lưu. Khi bấm xác nhận, hệ thống sẽ tự động lưu phiếu xét nghiệm để đồng bộ và gắn kết với hóa đơn này.
              </span>
            </div>
            {onSaveReportFirst && (
              <button
                type="button"
                onClick={onSaveReportFirst}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0"
              >
                Lưu Phiếu Khám Ngay
              </button>
            )}
          </div>
        )}

        {/* BODY MODAL: FORM THIẾT LẬP THU PHÍ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* CỘT TRÁI (7 CỘT): DANH MỤC DỊCH VỤ, PHỤ PHÍ & CHIẾT KHẤU */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* BẢNG DỊCH VỤ / XÉT NGHIỆM */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                  Chi Tiết Danh Mục Thu Phí ({items.length} mục)
                </h4>
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 flex items-center space-x-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm Dịch Vụ</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">STT</th>
                      <th className="py-2 px-3">Tên Dịch Vụ / Xét Nghiệm</th>
                      <th className="py-2 px-3 w-28 text-right">Đơn Giá</th>
                      <th className="py-2 px-2 w-16 text-center">SL</th>
                      <th className="py-2 px-3 w-28 text-right">Thành Tiền</th>
                      <th className="py-2 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          Chưa có dịch vụ nào trong hóa đơn
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => {
                        const lineTotal = (it.price || 0) * (it.quantity || 1);
                        return (
                          <tr key={`${it.code}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={it.name}
                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                className="w-full bg-transparent font-semibold focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5 border border-transparent focus:border-slate-300 transition"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={it.price}
                                onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                                className="w-24 text-right font-mono bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5 border border-transparent focus:border-slate-300 transition font-semibold"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min={1}
                                value={it.quantity || 1}
                                onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                                className="w-12 text-center font-mono bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1 py-0.5 border border-transparent focus:border-slate-300 transition"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {lineTotal.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                                title="Xóa dịch vụ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PHỤ PHÍ & CHIẾT KHẤU */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
              
              {/* Phụ phí lấy mẫu tận nơi */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSurcharge}
                    onChange={(e) => setShowSurcharge(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-xs text-slate-700">Phụ phí phát sinh / Lấy mẫu tại nhà</span>
                </label>
                {showSurcharge && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={surchargeNote}
                      onChange={(e) => setSurchargeNote(e.target.value)}
                      placeholder="Lý do phụ phí"
                      className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg w-44"
                    />
                    <input
                      type="number"
                      value={surchargeAmount}
                      onChange={(e) => setSurchargeAmount(Number(e.target.value))}
                      className="text-xs font-mono font-bold text-right px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg w-28"
                    />
                    <span className="text-xs text-slate-500">đ</span>
                  </div>
                )}
              </div>

              {/* Chiết khấu / Giảm giá */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-bold text-xs text-slate-700">Giảm giá / Ưu đãi:</span>
                <div className="flex items-center space-x-2">
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition ${
                        discountType === 'percent' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('amount')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition ${
                        discountType === 'amount' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      VNĐ
                    </button>
                  </div>
                  <input
                    type="number"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="text-xs font-mono font-bold text-right px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg w-28"
                  />
                  <span className="text-xs font-bold text-red-600 font-mono">
                    (-{calculatedDiscount.toLocaleString('vi-VN')} đ)
                  </span>
                </div>
              </div>

              {/* TỔNG KẾT TIỀN */}
              <div className="pt-3 border-t-2 border-slate-200 flex flex-col space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Tiền dịch vụ:</span>
                  <span className="font-mono">{rawSubtotal.toLocaleString('vi-VN')} đ</span>
                </div>
                {showSurcharge && surchargeAmount > 0 && (
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Phụ phí:</span>
                    <span className="font-mono">+{surchargeAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-xs text-red-600 font-medium">
                    <span>Chiết khấu ({discountPercent}%):</span>
                    <span className="font-mono">-{calculatedDiscount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-dashed border-slate-200">
                  <span className="text-slate-900 uppercase">TỔNG CỘNG THỰC THU:</span>
                  <span className="font-mono text-lg text-emerald-600">
                    {finalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* CỘT PHẢI (5 CỘT): PHƯƠNG THỨC THANH TOÁN, VIETQR & GHI CHÚ */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* HÌNH THỨC THANH TOÁN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                Hình Thức Thanh Toán
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHOD_LIST.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      paymentMethod === m
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* KHUNG VIETQR ĐỘNG NẾU CHỌN CHUYỂN KHOẢN */}
            {paymentMethod === 'Chuyển khoản (VietQR)' && (
              <div className="bg-white border-2 border-indigo-500/40 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-sm">
                <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-xs">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Quét Mã VietQR Napas 247</span>
                </div>

                <div className="bg-white p-1.5 border border-slate-200 rounded-xl shadow-inner max-w-[160px]">
                  <img
                    src={clinicInfo?.bankQrImageUrl || vietQrUrl}
                    alt="VietQR Chuyển Khoản"
                    className="w-full h-auto object-contain rounded"
                    loading="eager"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GoLab';
                    }}
                  />
                </div>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">{clinicInfo?.bankName || clinicInfo?.bankId || 'VietinBank'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-mono font-bold text-indigo-900">{bankAcc}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankAcc, 'acc')}
                        className="text-slate-400 hover:text-indigo-600 p-0.5"
                        title="Sao chép STK"
                      >
                        {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800 uppercase text-[10.5px]">{bankAccName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Nội dung CK:</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-mono font-bold text-red-600 text-[10.5px]">{transferContent}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(transferContent, 'content')}
                        className="text-slate-400 hover:text-indigo-600 p-0.5"
                        title="Sao chép nội dung CK"
                      >
                        {copiedField === 'content' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* THÔNG TIN BÁC SĨ & THU NGÂN & GHI CHÚ */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Bác sĩ chỉ định:</label>
                <input
                  type="text"
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Thu ngân / Kế toán lập phiếu:</label>
                <input
                  type="text"
                  value={cashier}
                  onChange={(e) => setCashier(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ghi chú hóa đơn:</label>
                <textarea
                  rows={2}
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                  placeholder="Nhập ghi chú thêm cho hóa đơn này (nếu có)..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-normal"
                />
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER MODAL */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 text-xs gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-slate-600">
            <span>
              Thực thu: <strong className="font-mono text-emerald-700 text-sm font-black">{finalAmount.toLocaleString('vi-VN')} đ</strong>
            </span>

            {/* Cloud Link Badge nếu đã xuất Cloud */}
            {cloudPdfUrl && (
              <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Đã lưu Cloud</span>
                <a
                  href={cloudPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 underline flex items-center ml-1"
                  title="Mở file PDF Cloud"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Cụm nút hành động chính */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => handleSaveWithStatus('Chưa thu phí')}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100/90 text-amber-800 border border-amber-300 font-bold rounded-xl shadow-xs flex items-center space-x-1.5 active:scale-95 transition"
              title="Lưu hóa đơn vào sổ nhưng đánh dấu Chưa Thu Tiền (Chờ thanh toán sau)"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Lưu Hóa Đơn (Chờ Thu)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveWithStatus('Đã thanh toán')}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center space-x-1.5 active:scale-95 transition"
              title="Xác nhận bệnh nhân đã nộp đủ tiền viện phí"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Xác Nhận Đã Thu Tiền</span>
            </button>
          </div>
        </div>

        {/* BẢN IN PHIẾU THU NGẦM CHO HTML2CANVAS XUẤT PDF CHẤT LƯỢNG CAO */}
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '210mm',
            pointerEvents: 'none',
            zIndex: -1
          }}
          aria-hidden="true"
        >
          <PrintReceiptView
            elementId="invoice-receipt-print-element"
            invoice={currentInvoice}
            clinicInfo={clinicInfo}
          />
        </div>

      </div>
    </div>
  );
}
