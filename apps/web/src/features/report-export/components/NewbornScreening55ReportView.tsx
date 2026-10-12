import { memo } from 'react';
import {
  PRINT_ELEMENT_ID,
  NewbornScreening55DomainService,
  calculateSamplingAgeDays,
  formatMSMSEvaluationText,
  NEWBORN_SCREENING_8_FIXED_NOTES,
  DEFAULT_55_DISEASE_RULES,
  MarkerEvaluation
} from '@domain/index';
import { formatDecimalNumber } from '@domain/formatters';

import type { ClinicInfo, Patient, CatalogItem, TestPackage, Gender } from '@domain/types';

export interface NewbornPatientInfo extends Partial<Omit<Patient, 'gender'>> {
  gender?: Gender | string;
  samplingDate?: string;
  receiveDate?: string;
  resultDate?: string;
  weight?: string | number;
  sampleSender?: string;
  packageName?: string;
  hospital?: string;
}

export interface NewbornClinicInfo extends Partial<ClinicInfo> {
  logo?: string;
  stamp?: string;
  hotline?: string;
}

export interface NewbornTestItem extends Partial<CatalogItem> {
  value?: string | number | null;
  decimalPlaces?: number | null;
}

interface NewbornScreening55ReportViewProps {
  elementId?: string;
  patient: NewbornPatientInfo;
  clinicInfo?: NewbornClinicInfo;
  selectedTests?: readonly NewbornTestItem[];
  conclusion?: string;
  doctorName?: string;
  qrCodeDataUrl?: string;
  testPackages?: readonly Partial<TestPackage>[];
}

// 38 marker MS/MS chuẩn sơ sinh nếu danh sách test chưa có đủ 38 dòng
const DEFAULT_38_MARKERS = [
  { marker: 'C0', name: 'Free carnitine', unit: 'µmol/L', refMin: 9.0, refMax: 55.0, refText: '9,0 – 55,0', decimalPlaces: 1 },
  { marker: 'C2', name: 'Acetylcarnitine', unit: 'µmol/L', refMin: 8.0, refMax: null, refText: '> 8,0', decimalPlaces: 1 },
  { marker: 'C3', name: 'Propionylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 4.2, refText: '< 4,20', decimalPlaces: 2 },
  { marker: 'C4', name: 'Butyrylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 1.0, refText: '< 1,0', decimalPlaces: 1 },
  { marker: 'C4-OH', name: '3-Hydroxybutyrylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.20, refText: '< 0,20', decimalPlaces: 2 },
  { marker: 'C5', name: 'Isovalerylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.50, refText: '< 0,50', decimalPlaces: 2 },
  { marker: 'C5:1', name: 'Tiglylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.15, refText: '< 0,15', decimalPlaces: 2 },
  { marker: 'C5-OH', name: '3-Hydroxyisovalerylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.60, refText: '< 0,60', decimalPlaces: 2 },
  { marker: 'C5DC', name: 'Glutarylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.20, refText: '< 0,20', decimalPlaces: 2 },
  { marker: 'C6', name: 'Hexanoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.25, refText: '< 0,25', decimalPlaces: 2 },
  { marker: 'C6DC', name: 'Adipylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.15, refText: '< 0,15', decimalPlaces: 2 },
  { marker: 'C8', name: 'Octanoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.30, refText: '< 0,30', decimalPlaces: 2 },
  { marker: 'C8:1', name: 'Octenoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.40, refText: '< 0,40', decimalPlaces: 2 },
  { marker: 'C10', name: 'Decanoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.35, refText: '< 0,35', decimalPlaces: 2 },
  { marker: 'C10:1', name: 'Decenoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.20, refText: '< 0,20', decimalPlaces: 2 },
  { marker: 'C10:2', name: 'Decadienoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.15, refText: '< 0,15', decimalPlaces: 2 },
  { marker: 'C12', name: 'Dodecanoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.50, refText: '< 0,50', decimalPlaces: 2 },
  { marker: 'C14', name: 'Tetradecanoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.60, refText: '< 0,60', decimalPlaces: 2 },
  { marker: 'C14:1', name: 'Tetradecenoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.40, refText: '< 0,40', decimalPlaces: 2 },
  { marker: 'C16', name: 'Palmitoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 6.20, refText: '< 6,20', decimalPlaces: 2 },
  { marker: 'C16-OH', name: '3-Hydroxypalmitoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.10, refText: '< 0,10', decimalPlaces: 2 },
  { marker: 'C18', name: 'Stearoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 1.80, refText: '< 1,80', decimalPlaces: 2 },
  { marker: 'C18:1', name: 'Oleylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 2.70, refText: '< 2,70', decimalPlaces: 2 },
  { marker: 'C18:1-OH', name: '3-Hydroxyoleylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.08, refText: '< 0,08', decimalPlaces: 2 },
  { marker: 'C18-OH', name: '3-Hydroxystearoylcarnitine', unit: 'µmol/L', refMin: 0, refMax: 0.08, refText: '< 0,08', decimalPlaces: 2 },
  { marker: 'C3/C2', name: 'Tỷ lệ C3/C2', unit: '', refMin: 0, refMax: 0.25, refText: '< 0,25', decimalPlaces: 2 },
  { marker: 'C8/C10', name: 'Tỷ lệ C8/C10', unit: '', refMin: 0, refMax: 1.5, refText: '< 1,5', decimalPlaces: 1 },
  { marker: 'C3/C16', name: 'Tỷ lệ C3/C16', unit: '', refMin: 0, refMax: 2.5, refText: '< 2,5', decimalPlaces: 1 },
  { marker: 'Phe', name: 'Phenylalanine', unit: 'µmol/L', refMin: 30.0, refMax: 120.0, refText: '30,0 – 120,0', decimalPlaces: 1 },
  { marker: 'Tyr', name: 'Tyrosine', unit: 'µmol/L', refMin: 25.0, refMax: 180.0, refText: '25,0 – 180,0', decimalPlaces: 1 },
  { marker: 'Met', name: 'Methionine', unit: 'µmol/L', refMin: 10.0, refMax: 50.0, refText: '10,0 – 50,0', decimalPlaces: 1 },
  { marker: 'Leu', name: 'Leucine / Isoleucine', unit: 'µmol/L', refMin: 50.0, refMax: 250.0, refText: '50,0 – 250,0', decimalPlaces: 1 },
  { marker: 'Val', name: 'Valine', unit: 'µmol/L', refMin: 60.0, refMax: 250.0, refText: '60,0 – 250,0', decimalPlaces: 1 },
  { marker: 'Cit', name: 'Citrulline', unit: 'µmol/L', refMin: 5.0, refMax: 50.0, refText: '5,0 – 50,0', decimalPlaces: 1 },
  { marker: 'Arg', name: 'Arginine', unit: 'µmol/L', refMin: 5.0, refMax: 50.0, refText: '5,0 – 50,0', decimalPlaces: 1 },
  { marker: 'Orn', name: 'Ornithine', unit: 'µmol/L', refMin: 20.0, refMax: 150.0, refText: '20,0 – 150,0', decimalPlaces: 1 },
  { marker: 'Gly', name: 'Glycine', unit: 'µmol/L', refMin: 150.0, refMax: 600.0, refText: '150,0 – 600,0', decimalPlaces: 1 },
  { marker: 'Phe/Tyr', name: 'Tỷ lệ Phe/Tyr', unit: '', refMin: 0, refMax: 2.0, refText: '< 2,0', decimalPlaces: 1 }
];

function NewbornScreening55ReportView({
  elementId = PRINT_ELEMENT_ID.NEWBORN55_REPORT,
  patient,
  clinicInfo,
  selectedTests = [],
  conclusion,
  doctorName = 'BS. Chuyên Khoa Sàng Lọc',
  qrCodeDataUrl,
  testPackages = []
}: NewbornScreening55ReportViewProps) {
  // 1. Phân loại 38 marker định lượng MS/MS
  const markerEvaluations: MarkerEvaluation[] = DEFAULT_38_MARKERS.map(def => {
    const matched = selectedTests.find(
      t =>
        t.code?.toUpperCase() === `SS_${def.marker}`.toUpperCase() ||
        t.code?.toUpperCase() === def.marker.toUpperCase() ||
        t.name?.toLowerCase().includes(def.marker.toLowerCase())
    );

    const rawValStr = matched?.value !== undefined ? String(matched.value).trim().replace(',', '.') : '';
    const numVal = rawValStr !== '' && !isNaN(Number(rawValStr)) ? Number(rawValStr) : null;
    const min = matched?.refMin !== undefined && matched?.refMin !== null ? matched.refMin : def.refMin;
    const max = matched?.refMax !== undefined && matched?.refMax !== null ? matched.refMax : def.refMax;

    const evalText = formatMSMSEvaluationText(numVal, min, max);
    const isOutOfRange =
      evalText === 'Cao hơn giới hạn sàng lọc ↑' || evalText === 'Thấp hơn giới hạn sàng lọc ↓';

    return {
      marker: def.marker,
      name: matched?.name || def.name,
      value: numVal,
      unit: matched?.unit !== undefined ? matched.unit : def.unit,
      refText: matched?.refText || def.refText,
      evaluation: evalText,
      isOutOfRange,
      decimalPlaces: matched?.decimalPlaces ?? def.decimalPlaces
    };
  });

  // 2. Đánh giá 55 bệnh sơ sinh
  const summary = NewbornScreening55DomainService.evaluateScreening(
    markerEvaluations,
    DEFAULT_55_DISEASE_RULES
  );

  // Kết luận ưu tiên conclusion người dùng sửa tay nếu có
  const effectiveConclusion = conclusion && conclusion.trim() !== '' ? conclusion : summary.autoConclusion;

  // Tuổi tại ngày lấy mẫu
  const samplingAge = calculateSamplingAgeDays(patient?.dob, patient?.samplingDate);

  // 55 bệnh chia 2 bảng: 01-28 và 29-55
  const diseasesPart1 = summary.diseaseResults.slice(0, 28);
  const diseasesPart2 = summary.diseaseResults.slice(28, 55);

  const packageName =
    patient?.packageName ||
    testPackages.find(p => p.name?.includes('55'))?.name ||
    'Sàng lọc sơ sinh 55 bệnh rối loạn chuyển hóa bẩm sinh (MS/MS) – V2';

  const defaultCenter = clinicInfo?.name || 'HỆ THỐNG XÉT NGHIỆM GOLAB';

  return (
    <div
      id={elementId}
      className="bg-white text-slate-800 font-sans print:w-full select-text leading-tight"
      style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}
    >
      <style>{`
        @media print {
          .newborn-page {
            page-break-after: always;
            break-after: page;
            height: 297mm;
            max-height: 297mm;
            box-sizing: border-box;
          }
        }
      `}</style>

      {/* ════════════════════ TRANG 1: PROFILE ĐỊNH LƯỢNG MS/MS ════════════════════ */}
      <section className="report-page newborn-page relative flex flex-col justify-between p-7 w-[210mm] min-h-[297mm] box-border border-b border-slate-200 print:border-none">
        <div>
          {/* Header Phòng Khám & Tiêu Đề */}
          <div className="flex items-start justify-between border-b-2 border-teal-700 pb-2 mb-2">
            <div className="flex items-center gap-3">
              {(clinicInfo?.logoUrl || clinicInfo?.logo) ? (
                <img src={clinicInfo.logoUrl || clinicInfo.logo} alt="Logo" className="w-14 h-14 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-teal-800 text-white rounded flex items-center justify-center font-bold text-lg">
                  GL
                </div>
              )}
              <div>
                <h1 className="font-extrabold text-[15px] uppercase text-teal-900 tracking-wide">
                  {clinicInfo?.name || 'HỆ THỐNG XÉT NGHIỆM Y KHOA GOLAB'}
                </h1>
                <p className="text-[10px] text-slate-600">
                  Địa chỉ: {clinicInfo?.address || 'Tầng 2, Tòa nhà Y Tế Kỹ Thuật Cao, TP. Đồng Hới, Quảng Bình'}
                </p>
                <p className="text-[10px] text-slate-600">
                  Hotline: <span className="font-semibold">{clinicInfo?.phone || clinicInfo?.hotline || '032.855.3773'}</span> | Website: {clinicInfo?.website || 'golab.com.vn'}
                </p>
              </div>
            </div>

            {qrCodeDataUrl && (
              <div className="flex flex-col items-center">
                <img src={qrCodeDataUrl} alt="QR" className="w-14 h-14 border border-slate-200 p-0.5 rounded" />
                <span className="text-[8px] text-slate-500 font-mono mt-0.5">Tra cứu KQ</span>
              </div>
            )}
          </div>

          <div className="text-center my-2">
            <h2 className="text-[16px] font-black uppercase text-teal-950 tracking-wider">
              PHIẾU KẾT QUẢ SÀNG LỌC 55 BỆNH CHUYỂN HÓA BẨM SINH
            </h2>
            <p className="text-[10.5px] italic text-slate-600 font-medium mt-0.5">
              (Phương pháp khối phổ kép Tandem Mass Spectrometry – MS/MS)
            </p>
          </div>

          {/* 2 & 3. Thông tin khách hàng & Thông tin mẫu */}
          <div className="border border-teal-800/40 rounded bg-teal-50/20 p-2 mb-3 text-[10.5px] grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="font-bold text-slate-700">Họ và tên: </span>
              <span className="font-extrabold text-red-700 uppercase text-[11px]">{patient?.name || '---'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Mã bệnh phẩm: </span>
              <span className="font-extrabold text-red-700 font-mono text-[11px]">{patient?.code || '---'}</span>
            </div>

            <div>
              <span className="font-bold text-slate-700">Ngày sinh: </span>
              <span>{patient?.dob || '---'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Giới tính: </span>
              <span>{patient?.gender || '---'}</span>
            </div>

            <div>
              <span className="font-bold text-slate-700">Số điện thoại: </span>
              <span>{patient?.phone || '---'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Cân nặng (g): </span>
              <span>{patient?.weight ? `${patient.weight} g` : '---'}</span>
            </div>

            <div className="col-span-2">
              <span className="font-bold text-slate-700">Địa chỉ: </span>
              <span>{patient?.address || '---'}</span>
            </div>

            <div className="col-span-2 border-t border-teal-200/60 pt-1 mt-0.5 grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="font-bold text-slate-700">Gói xét nghiệm: </span>
                <span className="font-semibold text-teal-950">{packageName}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Đơn vị thực hiện: </span>
                <span>{defaultCenter}</span>
              </div>

              <div>
                <span className="font-bold text-slate-700">Nơi gửi mẫu: </span>
                <span>{patient?.sampleSender || patient?.hospital || '---'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Tình trạng mẫu: </span>
                <span className="font-semibold text-emerald-800">{patient?.sampleStatus || 'Đạt'}</span>
              </div>

              <div>
                <span className="font-bold text-slate-700">Ngày lấy mẫu: </span>
                <span>{patient?.samplingDate || '---'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Tuổi tại ngày lấy mẫu: </span>
                <span className="font-bold text-teal-900 bg-teal-100/70 px-1.5 py-0.2 rounded text-[10px]">
                  {samplingAge}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-700">Ngày nhận mẫu: </span>
                <span>{patient?.receiveDate || '---'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Ngày trả KQ: </span>
                <span>{patient?.resultDate || '---'}</span>
              </div>
            </div>
          </div>

          {/* 4. Bảng PROFILE ĐỊNH LƯỢNG MS/MS (38 dòng) */}
          <div>
            <div className="bg-teal-800 text-white font-bold text-[11px] py-1 px-2 uppercase rounded-t tracking-wide flex justify-between">
              <span>PROFILE ĐỊNH LƯỢNG MS/MS</span>
              <span className="text-[9.5px] font-normal lowercase italic text-teal-100">38 chỉ số định lượng</span>
            </div>

            <table className="w-full text-[9.5px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-teal-100/60 text-teal-950 font-bold border-b border-slate-300">
                  <th className="p-1 border-r border-slate-300 text-left w-[12%]">Marker</th>
                  <th className="p-1 border-r border-slate-300 text-left w-[30%]">Tên chất</th>
                  <th className="p-1 border-r border-slate-300 text-right w-[14%]">Kết quả</th>
                  <th className="p-1 border-r border-slate-300 text-center w-[12%]">Đơn vị</th>
                  <th className="p-1 border-r border-slate-300 text-center w-[16%]">Tham chiếu</th>
                  <th className="p-1 text-center w-[16%]">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {markerEvaluations.map((m, idx) => {
                  const isAbnormal = m.isOutOfRange;
                  const rowBg = isAbnormal ? 'bg-amber-50/70' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                  return (
                    <tr key={m.marker} className={`${rowBg} border-b border-slate-200 hover:bg-teal-50/40`}>
                      <td className="p-0.8 px-1.5 border-r border-slate-200 font-mono font-bold text-slate-800">
                        {m.marker}
                      </td>
                      <td className="p-0.8 px-1.5 border-r border-slate-200 text-slate-700">{m.name}</td>
                      <td className={`p-0.8 px-1.5 border-r border-slate-200 text-right font-mono font-bold ${isAbnormal ? 'text-red-700' : 'text-slate-900'}`}>
                        {m.value !== null ? formatDecimalNumber(m.value, m.decimalPlaces) : '---'}
                      </td>
                      <td className="p-0.8 px-1 border-r border-slate-200 text-center text-slate-600">{m.unit}</td>
                      <td className="p-0.8 px-1 border-r border-slate-200 text-center font-mono text-slate-600">{m.refText}</td>
                      <td className={`p-0.8 px-1 text-center font-semibold text-[9px] ${
                        m.evaluation.includes('Cao')
                          ? 'text-red-700'
                          : m.evaluation.includes('Thấp')
                          ? 'text-amber-700'
                          : 'text-emerald-800'
                      }`}>
                        {m.evaluation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chân trang 1 */}
        <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-500">
          <span>{clinicInfo?.name || 'HỆ THỐNG XÉT NGHIỆM GOLAB'}</span>
          <span>Trang 1/3</span>
        </div>
      </section>

      {/* ════════════════════ TRANG 2: DANH SÁCH BỆNH 01 - 28 ════════════════════ */}
      <section className="report-page newborn-page relative flex flex-col justify-between p-7 w-[210mm] min-h-[297mm] box-border border-b border-slate-200 print:border-none">
        <div>
          {/* Header trang 2+ theo quy định: Họ và tên: … | Mã bệnh phẩm: … */}
          <div className="flex justify-between items-center border-b border-teal-800/40 pb-1.5 mb-3 text-[10.5px]">
            <div>
              <span className="font-bold text-slate-600">Họ và tên: </span>
              <span className="font-extrabold text-red-700 uppercase">{patient?.name || '---'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600">Mã bệnh phẩm: </span>
              <span className="font-extrabold text-red-700 font-mono">{patient?.code || '---'}</span>
            </div>
          </div>

          <div className="mb-2">
            <h3 className="text-[13px] font-black uppercase text-teal-900 border-l-4 border-teal-700 pl-2">
              CHI TIẾT 55 BỆNH – DANH SÁCH BỆNH 01 - 28
            </h3>
            <p className="text-[9.5px] text-slate-500 italic pl-3 mt-0.5">
              Đánh giá tự động dựa trên nồng độ các marker MS/MS tương ứng theo ngưỡng sàng lọc y khoa
            </p>
          </div>

          <table className="w-full text-[9.5px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-teal-100/60 text-teal-950 font-bold border-b border-slate-300">
                <th className="p-1 border-r border-slate-300 text-center w-[6%]">STT</th>
                <th className="p-1 border-r border-slate-300 text-left w-[42%]">Bệnh / rối loạn</th>
                <th className="p-1 border-r border-slate-300 text-left w-[32%]">Marker / ngưỡng đánh giá</th>
                <th className="p-1 text-center w-[20%]">Kết quả sàng lọc</th>
              </tr>
            </thead>
            <tbody>
              {diseasesPart1.map((d, idx) => {
                const isHighRisk = d.status === 'HIGH_RISK';
                const rowBg = isHighRisk ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                return (
                  <tr key={d.code} className={`${rowBg} border-b border-slate-200 hover:bg-teal-50/30`}>
                    <td className="p-1 border-r border-slate-200 text-center font-mono font-bold text-slate-700">
                      {d.index}
                    </td>
                    <td className="p-1 border-r border-slate-200 text-slate-800 font-medium">
                      {d.name}
                    </td>
                    <td className="p-1 border-r border-slate-200 text-slate-600 font-mono text-[9px]">
                      {d.expression}
                    </td>
                    <td className={`p-1 text-center font-bold text-[9px] ${
                      isHighRisk
                        ? 'text-red-700 bg-red-100/70'
                        : d.status === 'LOW_RISK_LIMITED'
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                    }`}>
                      {d.statusText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Chân trang 2 */}
        <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-500">
          <span>{clinicInfo?.name || 'HỆ THỐNG XÉT NGHIỆM GOLAB'}</span>
          <span>Trang 2/3</span>
        </div>
      </section>

      {/* ════════════════════ TRANG 3: DANH SÁCH BỆNH 29 - 55, LƯU Ý & KẾT LUẬN ════════════════════ */}
      <section className="report-page newborn-page relative flex flex-col justify-between p-7 w-[210mm] min-h-[297mm] box-border">
        <div>
          {/* Header trang 3: Họ và tên: … | Mã bệnh phẩm: … */}
          <div className="flex justify-between items-center border-b border-teal-800/40 pb-1.5 mb-2 text-[10.5px]">
            <div>
              <span className="font-bold text-slate-600">Họ và tên: </span>
              <span className="font-extrabold text-red-700 uppercase">{patient?.name || '---'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600">Mã bệnh phẩm: </span>
              <span className="font-extrabold text-red-700 font-mono">{patient?.code || '---'}</span>
            </div>
          </div>

          <div className="mb-1.5">
            <h3 className="text-[13px] font-black uppercase text-teal-900 border-l-4 border-teal-700 pl-2">
              CHI TIẾT 55 BỆNH – DANH SÁCH BỆNH 29 - 55
            </h3>
          </div>

          <table className="w-full text-[9px] border-collapse border border-slate-300 mb-3">
            <thead>
              <tr className="bg-teal-100/60 text-teal-950 font-bold border-b border-slate-300">
                <th className="p-0.8 border-r border-slate-300 text-center w-[6%]">STT</th>
                <th className="p-0.8 border-r border-slate-300 text-left w-[42%]">Bệnh / rối loạn</th>
                <th className="p-0.8 border-r border-slate-300 text-left w-[32%]">Marker / ngưỡng đánh giá</th>
                <th className="p-0.8 text-center w-[20%]">Kết quả sàng lọc</th>
              </tr>
            </thead>
            <tbody>
              {diseasesPart2.map((d, idx) => {
                const isHighRisk = d.status === 'HIGH_RISK';
                const rowBg = isHighRisk ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                return (
                  <tr key={d.code} className={`${rowBg} border-b border-slate-200 hover:bg-teal-50/30`}>
                    <td className="p-0.8 border-r border-slate-200 text-center font-mono font-bold text-slate-700">
                      {d.index}
                    </td>
                    <td className="p-0.8 border-r border-slate-200 text-slate-800 font-medium">
                      {d.name}
                    </td>
                    <td className="p-0.8 border-r border-slate-200 text-slate-600 font-mono text-[8.5px]">
                      {d.expression}
                    </td>
                    <td className={`p-0.8 text-center font-bold text-[8.5px] ${
                      isHighRisk
                        ? 'text-red-700 bg-red-100/70'
                        : d.status === 'LOW_RISK_LIMITED'
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                    }`}>
                      {d.statusText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 6. LƯU Ý (8 mục cố định) */}
          <div className="border border-slate-300 rounded bg-slate-50/80 p-2 mb-2 text-[8.5px] leading-relaxed">
            <h4 className="font-bold text-slate-800 uppercase text-[9.5px] mb-1 text-teal-950 flex items-center gap-1">
              <span>📌 LƯU Ý Y KHOA:</span>
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-700">
              {NEWBORN_SCREENING_8_FIXED_NOTES.map((note, nIdx) => (
                <div key={nIdx}>{note}</div>
              ))}
            </div>
          </div>

          {/* 7. KẾT LUẬN TỰ SINH / SỬA TAY */}
          <div className="border-2 border-teal-700/60 rounded bg-teal-50/30 p-2 text-[10px]">
            <h4 className="font-black text-teal-950 uppercase text-[10.5px] mb-1">
              KẾT LUẬN CỦA BÁC SĨ CHUYÊN KHOA:
            </h4>
            <p className="font-bold text-slate-900 leading-normal">
              {effectiveConclusion}
            </p>
          </div>

          {/* Chữ ký & Phụ trách */}
          <div className="flex justify-between items-end mt-3 px-4 text-[10px]">
            <div className="text-slate-600 italic">
              * Dấu (*) biểu thị các bệnh có độ nhạy sàng lọc hạn chế.
            </div>

            <div className="text-center">
              <p className="italic text-slate-600">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </p>
              <p className="font-bold uppercase text-slate-800 text-[10.5px] mt-0.5">
                PHỤ TRÁCH CHUYÊN MÔN
              </p>
              <div className="h-10 flex items-center justify-center">
                {(clinicInfo?.stampUrl || clinicInfo?.stamp) ? (
                  <img src={clinicInfo.stampUrl || clinicInfo.stamp} alt="Stamp" className="h-10 object-contain opacity-80" />
                ) : null}
              </div>
              <p className="font-extrabold text-teal-950 text-[11px]">{doctorName}</p>
            </div>
          </div>
        </div>

        {/* Chân trang 3 */}
        <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-500">
          <span>{clinicInfo?.name || 'HỆ THỐNG XÉT NGHIỆM GOLAB'}</span>
          <span>Trang 3/3</span>
        </div>
      </section>
    </div>
  );
}

export default memo(NewbornScreening55ReportView);
