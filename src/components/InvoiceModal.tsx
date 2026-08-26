import { useState, useMemo, useEffect } from 'react';
import {
  X, CreditCard, CheckCircle, Printer, Plus, Trash2, QrCode, Copy, Check,
  ZoomIn, ZoomOut, RotateCcw, AlertCircle, Save, Clock
} from 'lucide-react';
import { 
  Patient, SelectedTest, TestPackage, Doctor, Invoice, InvoiceItem, ClinicInfo, 
  PaymentMethod, BillingStatus, BILLING_STATUS, PAYMENT_METHOD 
} from '@domain';
import { buildInvoiceItems } from '@domain/pricing';
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

  // 4. CHẾ ĐỘ XEM TRƯỚC IN BIÊN LAI & ZOOM
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(0.85);
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

  const currentInvoice: Invoice = {
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
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  const handlePrint = () => {
    window.print();
  };

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
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shrink-0 shadow">
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

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsPrintPreview(!isPrintPreview)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                isPrintPreview
                  ? 'bg-amber-500 text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{isPrintPreview ? 'Quay Lại Sửa' : 'Xem Mẫu In Phiếu Thu'}</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition">
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
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-lg text-[11px] shadow-sm transition flex items-center gap-1 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Phiếu Ngay</span>
              </button>
            )}
          </div>
        )}

        {/* NỘI DUNG CHÍNH (MODE XEM TRƯỚC IN vs MODE CHỈNH SỬA THU PHÍ) */}
        {isPrintPreview ? (
          <div className="flex-1 min-h-0 flex flex-col bg-slate-200/90 overflow-hidden">
            {/* Thanh công cụ Zoom & Print của Preview */}
            <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between border-b border-slate-700 shrink-0 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-300 font-semibold">Tỉ lệ xem: <strong className="font-mono text-emerald-400">{Math.round(zoomScale * 100)}%</strong></span>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(prev + 0.1, 1.4))}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(prev - 0.1, 0.4))}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(0.85)}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition flex items-center gap-1 text-[11px] px-2"
                  title="Vừa màn hình"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Chuẩn 85%</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow flex items-center gap-1.5 transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Phiếu Thu A5</span>
                </button>
              </div>
            </div>

            {/* Vùng Canvas Cuộn Mượt Mà Cả Dọc Lẫn Ngang */}
            <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 flex justify-center items-start">
              <div
                className="bg-white shadow-2xl rounded-xl border border-slate-300 transition-transform duration-150 origin-top my-2"
                style={{ transform: `scale(${zoomScale})` }}
              >
                <PrintReceiptView invoice={currentInvoice} clinicInfo={clinicInfo} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
            
            {/* CỘT TRÁI (COL-7): DANH SÁCH DỊCH VỤ & PHỤ PHÍ */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11.5px] flex items-center gap-1.5">
                  <span>Chi Tiết Dịch Vụ & Chỉ Số ({items.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 flex items-center gap-1 transition text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Dịch Vụ / Vật Tư</span>
                </button>
              </div>

              {/* BẢNG DỊCH VỤ */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[260px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10 text-[11px]">
                    <tr>
                      <th className="py-2 px-2.5">Tên Dịch Vụ</th>
                      <th className="py-2 px-2 text-center w-16">Số Lượng</th>
                      <th className="py-2 px-2 text-right w-24">Đơn Giá</th>
                      <th className="py-2 px-2 text-right w-24">Thành Tiền</th>
                      <th className="py-2 px-2 text-center w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Chưa có dịch vụ nào trong hóa đơn
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5">
                            <span className="font-bold text-slate-900 block">{it.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{it.code}</span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={1}
                              value={it.quantity || 1}
                              onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                              className="w-12 text-center py-1 border border-slate-300 rounded font-bold font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              step={5000}
                              value={it.price}
                              onChange={(e) => handleItemChange(idx, 'price', Math.max(0, Number(e.target.value)))}
                              className="w-20 text-right py-1 px-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                            {((it.price || 0) * (it.quantity || 1)).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* KHỐI PHỤ PHÍ & GHI CHÚ */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11.5px]">Phụ Phí / Lấy Mẫu Tận Nơi</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSurchargeAmount(50000);
                        setSurchargeNote('Phí lấy mẫu tại nhà (<5km)');
                        setShowSurcharge(true);
                      }}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10.5px] font-bold text-slate-700"
                    >
                      +50k Gần
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSurchargeAmount(100000);
                        setSurchargeNote('Phí lấy mẫu tại nhà (>5km)');
                        setShowSurcharge(true);
                      }}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10.5px] font-bold text-slate-700"
                    >
                      +100k Xa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSurchargeAmount(0);
                        setSurchargeNote('');
                        setShowSurcharge(false);
                      }}
                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[10.5px] font-bold text-slate-600"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nội dung phụ phí:</label>
                    <input
                      type="text"
                      placeholder="Lấy mẫu tại nhà, khẩn..."
                      value={surchargeNote}
                      onChange={(e) => {
                        setSurchargeNote(e.target.value);
                        if (e.target.value && !showSurcharge) setShowSurcharge(true);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tiền phụ phí (VNĐ):</label>
                    <input
                      type="number"
                      step={10000}
                      value={surchargeAmount}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setSurchargeAmount(val);
                        setShowSurcharge(val > 0);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                    />
                  </div>
                </div>
              </div>

              {/* GHI CHÚ HÓA ĐƠN */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Ghi chú thu ngân:</label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm (khách hẹn, xuất hóa đơn đỏ...)"
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* CỘT PHẢI (COL-5): TỔNG TIỀN, CHIẾT KHẤU & PHƯƠNG THỨC THANH TOÁN (VIETQR) */}
            <div className="lg:col-span-5 flex flex-col space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              
              <div className="space-y-2 border-b border-slate-200 pb-3">
                <div className="flex justify-between items-center text-slate-600 font-semibold">
                  <span>Tiền dịch vụ:</span>
                  <span className="font-mono text-slate-900 font-bold">{rawSubtotal.toLocaleString('vi-VN')} đ</span>
                </div>

                {surchargeAmount > 0 && (
                  <div className="flex justify-between items-center text-sky-800 font-semibold">
                    <span>Phụ phí ({surchargeNote || 'Lấy mẫu'}):</span>
                    <span className="font-mono font-bold">+{surchargeAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {/* GIẢM GIÁ / CHIẾT KHẤU */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">Giảm giá / Chiết khấu:</span>
                    <div className="flex items-center space-x-1 bg-slate-200 p-0.5 rounded-lg text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => setDiscountType('amount')}
                        className={`px-2 py-0.5 rounded font-bold transition ${
                          discountType === 'amount' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        VNĐ
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-2 py-0.5 rounded font-bold transition ${
                          discountType === 'percent' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={0}
                      max={discountType === 'percent' ? 100 : totalWithSurcharge}
                      value={discountVal}
                      onChange={(e) => setDiscountVal(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-slate-900 text-xs"
                    />
                    <span className="font-bold text-slate-500">{discountType === 'percent' ? '%' : 'đ'}</span>
                  </div>

                  {calculatedDiscount > 0 && (
                    <p className="text-right text-[11px] text-rose-600 font-bold mt-1">
                      Giảm: -{calculatedDiscount.toLocaleString('vi-VN')} đ ({discountPercent}%)
                    </p>
                  )}
                </div>

                {/* THỰC THU */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-black text-slate-900 text-sm uppercase">TỔNG THỰC THU:</span>
                  <span className="font-mono text-xl font-black text-emerald-700">
                    {finalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* PHƯƠNG THỨC THANH TOÁN */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 text-[11.5px]">Hình Thức Thanh Toán</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Tiền mặt', 'Chuyển khoản (VietQR)', 'Quẹt thẻ'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-1.5 text-center rounded-xl font-bold transition text-xs border ${
                        paymentMethod === m
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {m === 'Chuyển khoản (VietQR)' ? 'VietQR' : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* KHUNG VIETQR ĐỘNG NẾU CHỌN CHUYỂN KHOẢN */}
              {paymentMethod === 'Chuyển khoản (VietQR)' && (
                <div className="bg-white border-2 border-indigo-500/40 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 animate-in fade-in zoom-in-95 duration-150 shadow-sm">
                  <div className="flex items-center space-x-1 text-indigo-900 font-bold text-[11.5px]">
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

                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px] space-y-1 text-left">
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

              {/* NGƯỜI THU TIỀN */}
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Thu ngân / Kế toán:</label>
                <input
                  type="text"
                  value={cashier}
                  onChange={(e) => setCashier(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

            </div>
          </div>
        )}

        {/* FOOTER MODAL */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-500">
            {isPrintPreview ? (
              <span>Đang ở chế độ xem trước bản in. Nhấp <strong>"In Biên Lai Ngay"</strong> để in hoặc xuất PDF.</span>
            ) : (
              <span>Thực thu: <strong className="font-mono text-emerald-700 text-sm font-black">{finalAmount.toLocaleString('vi-VN')} đ</strong></span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isPrintPreview ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsPrintPreview(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl"
                >
                  Quay Lại
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Biên Lai Ngay</span>
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
