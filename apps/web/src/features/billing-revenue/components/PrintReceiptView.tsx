import { Invoice, ClinicInfo, DEFAULT_CLINIC_INFO, getSafeClinicInfo } from '@domain/types';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';

interface PrintReceiptViewProps {
  elementId?: string;
  invoice: Invoice;
  clinicInfo?: ClinicInfo;
}

/**
 * Chuyển đổi số tiền thành chữ tiếng Việt chuẩn xác
 */
function numberToVietnameseWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'Không đồng';

  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  function readTriple(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const ten = Math.floor(remainder / 10);
    const one = remainder % 10;
    let res = '';

    if (hundred > 0) {
      res += ones[hundred] + ' trăm ';
    }

    if (ten > 1) {
      res += tens[ten] + ' ';
      if (one === 1) res += 'mốt ';
      else if (one === 5) res += 'lăm ';
      else if (one > 0) res += ones[one] + ' ';
    } else if (ten === 1) {
      res += 'mười ';
      if (one === 5) res += 'lăm ';
      else if (one > 0) res += ones[one] + ' ';
    } else if (ten === 0 && one > 0) {
      if (hundred > 0) res += 'lẻ ';
      res += ones[one] + ' ';
    }

    return res.trim();
  }

  let n = Math.abs(num);
  let groupIdx = 0;
  const groups: string[] = [];

  while (n > 0) {
    const triple = n % 1000;
    if (triple > 0) {
      const read = readTriple(triple);
      const scale = scales[groupIdx];
      groups.unshift(read + (scale ? ' ' + scale : ''));
    }
    n = Math.floor(n / 1000);
    groupIdx++;
  }

  const result = groups.join(' ').replace(/\s+/g, ' ').trim();
  if (!result) return 'Không đồng';
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn';
}

export default function PrintReceiptView({
  elementId = 'receipt-print-element',
  invoice,
  clinicInfo = DEFAULT_CLINIC_INFO
}: PrintReceiptViewProps) {
  const safeClinic = getSafeClinicInfo(clinicInfo);
  const currentLogo = clinicInfo.logoUrl || golabLogo;
  const currentStamp = clinicInfo.stampUrl || doctorStamp;

  const dateObj = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
  const dayStr = String(dateObj.getDate()).padStart(2, '0');
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yearStr = String(dateObj.getFullYear());

  const safeFinalAmount = invoice.finalAmount ?? 0;
  const amountWords = numberToVietnameseWords(safeFinalAmount);

  // Bank Info
  const bankId = clinicInfo.bankId || 'VBA';
  const bankName = clinicInfo.bankName || 'Agribank';
  const bankAccountNo = clinicInfo.bankAccountNo || '8888876781225';
  const bankAccountName = clinicInfo.bankAccountName || 'LE PHAN ANH';
  const bankBranch = clinicInfo.bankBranch || 'Agribank - Chi nhánh Lý Thái Tổ - Quảng Bình';
  const sampleCode = invoice.patientCode || invoice.code || 'BN-GOLAB';

  const transferContent = `${invoice.code} ${sampleCode} ${(invoice.patientName || '').replace(/[^a-zA-Z0-9\s]/g, '')}`.trim();

  // QR Image: custom uploaded or dynamic VietQR Napas 247
  const qrImageSource =
    clinicInfo.bankQrImageUrl ||
    `https://img.vietqr.io/image/${bankId}-${bankAccountNo}-compact2.png?amount=${safeFinalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankAccountName)}`;

  // Table items: guarantee at least 5 rows like in the template
  const MIN_ROWS = 5;
  const displayItems = [...(invoice.items || [])];
  const emptyRowsCount = Math.max(0, MIN_ROWS - displayItems.length);

  return (
    <div
      id={elementId}
      className="receipt-print-page bg-white text-slate-900 mx-auto text-[13px] leading-normal flex flex-col justify-between p-6 sm:p-8 font-sans shadow-lg print:shadow-none print:p-4"
      style={{
        width: '210mm',
        minHeight: '297mm', // Chuẩn A4
        maxHeight: '297mm',
        boxSizing: 'border-box',
        color: '#0f172a'
      }}
    >
      <div className="flex-1 flex flex-col justify-between">

        {/* ═══ 1. HEADER (LOGO + CLINIC INFO + PHIẾU THU BANNER) ═══ */}
        <div className="border-b-2 border-[#0f3a85] pb-3 mb-3">
          <div className="flex items-start justify-between gap-4">
            
            {/* Header Left: Logo + Info */}
            <div className="flex items-center space-x-3.5 max-w-[65%]">
              <img
                src={currentLogo}
                alt="GoLab Logo"
                className="h-16 w-auto max-w-[110px] object-contain shrink-0"
              />
              <div className="space-y-0.5 text-left">
                <p className="text-[12px] font-bold text-[#0f3a85] uppercase tracking-wider leading-none">
                  HỆ THỐNG XÉT NGHIỆM GOLAB
                </p>
                <h1 className="text-[15.5px] font-black text-[#0f3a85] uppercase tracking-tight leading-tight">
                  {safeClinic.name}
                </h1>
                <p className="text-[11.5px] text-slate-700 font-medium leading-snug">
                  Địa chỉ: {safeClinic.address}
                </p>
                <p className="text-[11px] text-slate-700 font-medium leading-snug">
                  Website: <strong className="text-slate-800">{safeClinic.website}</strong> &nbsp;|&nbsp; Hotline: <strong className="text-slate-900 font-bold">{safeClinic.phone}</strong>
                </p>
              </div>
            </div>

            {/* Header Right: Tiêu đề Phiếu Thu */}
            <div className="text-center shrink-0 min-w-[210px] flex flex-col items-center">
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#0f3a85',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  lineHeight: '1.25',
                  marginBottom: '6px'
                }}
              >
                PHIẾU THU
              </div>
              <div
                style={{
                  backgroundColor: '#0f3a85',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 14px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1.35',
                  marginBottom: '8px'
                }}
              >
                XÁC NHẬN THANH TOÁN
              </div>
              <div className="text-[12px] text-slate-700 text-left w-full pl-2 space-y-1">
                <div style={{ lineHeight: '1.35' }}>
                  Số phiếu: <strong className="font-mono font-bold text-[#0f3a85]">{invoice.code}</strong>
                </div>
                <div className="text-[11.5px]" style={{ lineHeight: '1.35' }}>
                  Ngày: <strong className="font-mono">{dayStr}</strong> / <strong className="font-mono">{monthStr}</strong> / <strong className="font-mono">{yearStr}</strong>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ═══ 2. SECTION I: THÔNG TIN BỆNH NHÂN ═══ */}
        <div className="space-y-1.5 mb-3 text-[13px]">
          <h3 className="text-[13.5px] font-bold text-[#0f3a85] uppercase tracking-wide">
            I. THÔNG TIN BỆNH NHÂN
          </h3>

          <div className="space-y-1 pl-1">
            <div className="flex items-baseline">
              <span className="font-semibold text-slate-800 shrink-0">Họ và tên (Bệnh nhân):</span>
              <span className="ml-2 font-bold uppercase text-slate-950 text-[14px] flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {invoice.patientName || '........................................................................................................................................................'}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold text-slate-800 shrink-0">Địa chỉ:</span>
              <span className="ml-2 text-slate-800 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {invoice.patientDob ? `Năm sinh: ${invoice.patientDob} • Giới tính: ${invoice.patientGender}` : '...................................................................................................................................................................'}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-4 items-baseline">
              <div className="col-span-6 flex items-baseline">
                <span className="font-semibold text-slate-800 shrink-0">Số điện thoại:</span>
                <span className="ml-2 font-mono text-slate-900 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  {invoice.patientPhone || '.......................................................................'}
                </span>
              </div>
              <div className="col-span-6 flex items-baseline">
                <span className="font-semibold text-slate-800 shrink-0">Mã bệnh phẩm (MBP):</span>
                <span className="ml-2 font-mono font-bold text-red-600 text-[14px] flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  {sampleCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 3. SECTION II: NỘI DUNG THU (BẢNG DỊCH VỤ) ═══ */}
        <div className="space-y-1.5 mb-3 text-[13px]">
          <h3 className="text-[13.5px] font-bold text-[#0f3a85] uppercase tracking-wide">
            II. NỘI DUNG THU
          </h3>

          <div className="border border-[#0f3a85] rounded-xs overflow-hidden">
            <table className="w-full text-left text-[12.5px] border-collapse">
              <thead className="bg-[#eff6ff] text-[#0f3a85] font-bold border-b border-[#0f3a85]">
                <tr>
                  <th className="py-1.5 px-2 w-[7%] text-center border-r border-[#0f3a85] uppercase">STT</th>
                  <th className="py-1.5 px-3 w-[47%] border-r border-[#0f3a85] uppercase">DỊCH VỤ / XÉT NGHIỆM</th>
                  <th className="py-1.5 px-2 w-[14%] text-center border-r border-[#0f3a85] uppercase">SỐ LƯỢNG</th>
                  <th className="py-1.5 px-2.5 w-[16%] text-center border-r border-[#0f3a85] uppercase">ĐƠN GIÁ (VNĐ)</th>
                  <th className="py-1.5 px-2.5 w-[16%] text-center uppercase">THÀNH TIỀN (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {/* Render Dịch Vụ Thực Tế */}
                {displayItems.map((item, idx) => {
                  const qty = item.quantity || 1;
                  const itemTotal = item.price * qty;
                  return (
                    <tr key={idx} className="h-7.5">
                      <td className="py-1 px-2 text-center font-mono text-slate-700 border-r border-[#0f3a85] align-middle">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-3 font-semibold text-slate-900 border-r border-[#0f3a85] align-middle">
                        {item.name}
                      </td>
                      <td className="py-1 px-2 text-center font-mono text-slate-800 border-r border-[#0f3a85] align-middle">
                        {qty}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono text-slate-800 border-r border-[#0f3a85] align-middle">
                        {item.price > 0 ? item.price.toLocaleString('vi-VN') : '---'}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 align-middle">
                        {itemTotal > 0 ? itemTotal.toLocaleString('vi-VN') : '---'}
                      </td>
                    </tr>
                  );
                })}

                {/* Render Hàng Trống để giữ đúng Form Mẫu (ít nhất 5 dòng) */}
                {Array.from({ length: emptyRowsCount }).map((_, eIdx) => {
                  const rowNum = displayItems.length + eIdx + 1;
                  return (
                    <tr key={`empty-${eIdx}`} className="h-7.5">
                      <td className="py-1 px-2 text-center font-mono text-slate-400 border-r border-[#0f3a85] align-middle">
                        {rowNum}
                      </td>
                      <td className="py-1 px-3 text-slate-300 border-r border-[#0f3a85] align-middle font-mono text-[11px]">
                        .........................................................................................................
                      </td>
                      <td className="py-1 px-2 text-center text-slate-300 border-r border-[#0f3a85] align-middle font-mono text-[11px]">
                        ..........
                      </td>
                      <td className="py-1 px-2.5 text-center text-slate-300 border-r border-[#0f3a85] align-middle font-mono text-[11px]">
                        ..................
                      </td>
                      <td className="py-1 px-2.5 text-center text-slate-300 align-middle font-mono text-[11px]">
                        ..................
                      </td>
                    </tr>
                  );
                })}

                {/* Phụ Phí nếu có */}
                {invoice.surchargeAmount && invoice.surchargeAmount > 0 ? (
                  <tr className="bg-sky-50/50">
                    <td className="py-1 px-2 text-center font-mono text-[#0f3a85] border-r border-[#0f3a85] font-bold">
                      +
                    </td>
                    <td className="py-1 px-3 font-semibold text-[#0f3a85] border-r border-[#0f3a85]">
                      {invoice.surchargeNote || 'Phụ phí lấy mẫu tận nơi'}
                    </td>
                    <td className="py-1 px-2 text-center font-mono border-r border-[#0f3a85]">1</td>
                    <td className="py-1 px-2.5 text-right font-mono border-r border-[#0f3a85]">
                      {(invoice.surchargeAmount || 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-1 px-2.5 text-right font-mono font-bold text-[#0f3a85]">
                      {(invoice.surchargeAmount || 0).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ) : null}

                {/* Chiết Khấu nếu có */}
                {invoice.discountAmount && invoice.discountAmount > 0 ? (
                  <tr className="bg-rose-50/50 text-rose-700">
                    <td className="py-1 px-2 text-center font-mono border-r border-[#0f3a85] font-bold">-</td>
                    <td className="py-1 px-3 font-semibold border-r border-[#0f3a85]">
                      Giảm giá / Chiết khấu ({invoice.discountPercent}%)
                    </td>
                    <td className="py-1 px-2 text-center font-mono border-r border-[#0f3a85]">1</td>
                    <td className="py-1 px-2.5 text-right font-mono border-r border-[#0f3a85]">
                      -{(invoice.discountAmount || 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-1 px-2.5 text-right font-mono font-bold text-rose-700">
                      -{(invoice.discountAmount || 0).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ) : null}

                {/* Hàng TỔNG CỘNG */}
                <tr className="bg-[#eff6ff] font-bold border-t-2 border-[#0f3a85]">
                  <td colSpan={4} className="py-2 px-3 text-center uppercase font-black text-[#0f3a85] border-r border-[#0f3a85] text-[13.5px]">
                    TỔNG CỘNG
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-black text-red-600 text-[15px]">
                    {(invoice.finalAmount ?? 0).toLocaleString('vi-VN')} VNĐ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Dòng Bằng Chữ & Checkbox Hình Thức Thanh Toán */}
          <div className="pt-1.5 space-y-1.5 pl-1 text-[12.5px]">
            <p className="flex items-baseline">
              <span className="font-semibold text-slate-800 shrink-0">Bằng chữ:</span>
              <strong className="ml-2 font-serif italic font-bold text-slate-900 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                {amountWords}
              </strong>
            </p>

            <div className="flex items-center space-x-6 pt-0.5 text-[12px] text-slate-800">
              <span className="font-semibold text-slate-800">Hình thức thanh toán:</span>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoice.paymentMethod === 'Tiền mặt'}
                  readOnly
                  className="w-3.5 h-3.5 accent-[#0f3a85]"
                />
                <span className={invoice.paymentMethod === 'Tiền mặt' ? 'font-bold text-slate-950' : 'text-slate-600'}>
                  Tiền mặt
                </span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoice.paymentMethod === 'Chuyển khoản (VietQR)'}
                  readOnly
                  className="w-3.5 h-3.5 accent-[#0f3a85]"
                />
                <span className={invoice.paymentMethod === 'Chuyển khoản (VietQR)' ? 'font-bold text-[#0f3a85]' : 'text-slate-600'}>
                  Chuyển khoản
                </span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoice.paymentMethod === 'Quẹt thẻ' || invoice.paymentMethod === 'Khác'}
                  readOnly
                  className="w-3.5 h-3.5 accent-[#0f3a85]"
                />
                <span className="text-slate-600">
                  Khác: <span className="border-b border-dotted border-slate-400 px-3">{invoice.paymentMethod === 'Quẹt thẻ' ? 'POS Quẹt thẻ' : '................'}</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ═══ 4. KHUNG THANH TOÁN QUA CHUYỂN KHOẢN (QR + THÔNG TIN TK) ═══ */}
        <div className="border border-[#3b82f6] rounded-xl p-3 mb-3 bg-white">
          {/* Tiêu đề khung chuyển khoản */}
          <div className="text-center font-bold text-[#0f3a85] uppercase tracking-wider text-[12px] pb-1 mb-2 border-b border-blue-100">
            ─────&nbsp;&nbsp;THANH TOÁN QUA CHUYỂN KHOẢN&nbsp;&nbsp;─────
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            {/* Cột 1: Mã QR Code */}
            <div className="col-span-3 flex justify-center items-center">
              <div className="p-1 border border-slate-300 rounded-lg bg-white shadow-2xs">
                <img
                  src={qrImageSource}
                  alt="Mã VietQR"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GoLab';
                  }}
                />
              </div>
            </div>

            {/* Cột 2: Logo & Thông tin Tài khoản Ngân hàng */}
            <div className="col-span-5 text-center border-r border-slate-200 pr-2 space-y-1 py-1">
              <div className="flex items-center justify-center space-x-1.5 leading-normal">
                <span className="font-extrabold italic text-[#005ba9] text-[12px] tracking-tight">napas<span className="text-amber-500">247</span></span>
                <span className="font-black text-red-700 uppercase text-[13.5px] tracking-tight font-serif">
                  {bankName}
                </span>
              </div>

              <div className="font-black text-[#0f3a85] text-[13.5px] uppercase tracking-wide leading-normal">
                {bankAccountName}
              </div>

              <div className="font-mono font-black text-red-600 text-[18px] tracking-wider leading-normal">
                {bankAccountNo}
              </div>

              <div className="text-[10px] text-slate-600 italic leading-normal">
                {bankBranch}
              </div>
            </div>

            {/* Cột 3: Nội dung chuyển khoản đối soát */}
            <div className="col-span-4 pl-2 text-center space-y-1.5 py-1">
              <div className="font-extrabold text-[#0f3a85] uppercase text-[12px] tracking-wide pb-1 border-b border-slate-100 leading-normal">
                NỘI DUNG CHUYỂN KHOẢN
              </div>
              <div className="font-mono font-bold text-red-600 text-[13.5px] leading-normal">
                MBP: {sampleCode}
              </div>
              <div className="font-black text-slate-900 text-[13.5px] uppercase leading-normal">
                {invoice.patientName || 'TÊN BỆNH NHÂN'}
              </div>
              <div className="text-[10px] text-slate-500 italic leading-normal">
                (Vui lòng ghi đúng nội dung để đối soát)
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 5. KHUNG CHỮ KÝ 3 CỘT ═══ */}
        <div className="border border-slate-300 rounded-xl p-3 mb-2 bg-white">
          <div className="grid grid-cols-3 gap-2 text-center text-[12.5px]">
            
            {/* Cột 1: Người lập phiếu */}
            <div className="flex flex-col items-center justify-between min-h-[110px]">
              <div>
                <p className="font-bold uppercase text-[#0f3a85] tracking-wide leading-tight">
                  NGƯỜI LẬP PHIẾU
                </p>
                <p className="text-[11px] text-slate-500 italic leading-tight">
                  (Ký, ghi rõ họ tên)
                </p>
              </div>

              {/* Chữ ký mẫu */}
              <div className="my-1 h-12 flex items-center justify-center font-serif italic text-blue-700 text-lg font-bold select-none opacity-85">
                {clinicInfo.cashierName ? clinicInfo.cashierName.split(' ').slice(-1)[0] : 'Jhan'}
              </div>

              <p className="font-bold text-red-600 text-[12.5px]">
                {invoice.cashierName || clinicInfo.cashierName || 'Lê Phan Anh'}
              </p>
            </div>

            {/* Cột 2: Xác nhận kế toán */}
            <div className="flex flex-col items-center justify-between min-h-[110px]">
              <div>
                <p className="font-bold uppercase text-[#0f3a85] tracking-wide leading-tight">
                  XÁC NHẬN
                </p>
                <p className="text-[11px] text-slate-500 italic leading-tight">
                  (Kế toán)
                </p>
              </div>

              {/* Chữ ký mẫu kế toán */}
              <div className="my-1 h-12 flex items-center justify-center font-serif italic text-blue-700 text-lg font-bold select-none opacity-85">
                {clinicInfo.accountantName ? clinicInfo.accountantName.split(' ').slice(-1)[0] : 'Thanh'}
              </div>

              <div>
                <p className="font-bold text-red-600 text-[12.5px]">
                  {clinicInfo.accountantName || 'Trần Thị Thanh Hương'}
                </p>
                <p className="text-[10.5px] text-slate-600 font-semibold leading-none">
                  Kế toán
                </p>
              </div>
            </div>

            {/* Cột 3: Đơn vị xác nhận (Con dấu) */}
            <div className="flex flex-col items-center justify-between min-h-[110px]">
              <div>
                <p className="font-bold uppercase text-[#0f3a85] tracking-wide leading-tight">
                  ĐƠN VỊ XÁC NHẬN
                </p>
                <p className="text-[11px] text-slate-500 italic leading-tight">
                  (Ký, đóng dấu)
                </p>
              </div>

              {/* Con dấu đỏ GoLab */}
              <div className="my-1 h-14 flex items-center justify-center">
                <img
                  src={currentStamp}
                  alt="Dấu Mộc GoLab"
                  className="h-14 w-auto object-contain max-w-[120px]"
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = doctorStamp;
                  }}
                />
              </div>

              <p className="font-bold text-[#0f3a85] uppercase text-[11.5px] leading-tight">
                {clinicInfo.defaultDoctor || 'GOLAB QUẢNG BÌNH'}
              </p>
            </div>

          </div>
        </div>

        {/* ═══ 6. FOOTER LƯU Ý ═══ */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10.5px]">
          <span className="text-slate-500 italic">
            * Phiếu thu chỉ có giá trị xác nhận đã nhận tiền, không thay thế hóa đơn tài chính.
          </span>
          <span className="font-bold italic text-[#0f3a85]">
            Cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ của GOLAB!
          </span>
        </div>

      </div>
    </div>
  );
}
