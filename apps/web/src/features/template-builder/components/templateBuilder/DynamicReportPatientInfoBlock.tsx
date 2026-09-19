import { memo } from 'react';
import { Patient, TemplateBlock, PatientInfoBlockProps, formatDisplayDate } from '@domain';

interface DynamicReportPatientInfoBlockProps {
  block: TemplateBlock;
  patient: Patient;
  doctorName?: string;
}

export const DynamicReportPatientInfoBlock = memo(function DynamicReportPatientInfoBlock({
  block,
  patient,
  doctorName
}: DynamicReportPatientInfoBlockProps) {
  const p = block.props as PatientInfoBlockProps;

  if (p.layout === 'grid_2_cols') {
    return (
      <div className="border border-slate-300 rounded mb-3 bg-white p-2.5 text-[12px] grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <span className="text-slate-500 font-medium">Họ tên:</span>{' '}
          <strong className={`uppercase ${p.highlightName ? 'text-red-600' : 'text-slate-900'}`}>{patient.name || '---'}</strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Mã BN / Số BP:</span>{' '}
          <strong className="font-mono">{patient.code} / <span className={p.highlightSampleCode ? 'text-red-600' : ''}>{patient.sampleCode || patient.code}</span></strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Năm sinh / Tuổi:</span> {patient.dob || '---'} ({patient.gender || 'Nam'})
        </div>
        <div>
          <span className="text-slate-500 font-medium">Bác sĩ chỉ định:</span> {patient.doctor || doctorName || '---'}
        </div>
        <div>
          <span className="text-slate-500 font-medium">Địa chỉ:</span> {patient.address || '---'}
        </div>
        <div>
          <span className="text-slate-500 font-medium">Thời gian:</span> {patient.receivedAt || new Date().toLocaleDateString('vi-VN')}
        </div>
      </div>
    );
  }

  // Default 12 fields table layout (6 rows, 4 columns)
  return (
    <div className="border border-slate-300 rounded mb-3.5 bg-white text-[12px]">
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Họ và tên:</td>
            <td className={`py-1.5 px-3 font-bold uppercase border-r border-b border-slate-300 align-middle ${p.highlightName !== false ? 'text-red-600 text-[13px]' : 'text-slate-900'}`}>{patient.name || '---'}</td>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">T/G chỉ định</td>
            <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle">{patient.orderedAt || new Date().toLocaleDateString('vi-VN')}</td>
          </tr>
          <tr>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Năm sinh:</td>
            <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle">{patient.dob || '---'}</td>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">T/G đóng phí</td>
            <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle">{formatDisplayDate(patient.paidAt, 'Chưa thu phí')}</td>
          </tr>
          <tr>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Địa chỉ</td>
            <td className="py-1.5 px-3 text-slate-800 border-r border-b border-slate-300 align-middle">{patient.address || 'Đồng Hới, Quảng Bình'}</td>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Số bệnh phẩm</td>
            <td className={`py-1.5 px-3 font-mono font-bold border-b border-slate-300 align-middle ${p.highlightSampleCode !== false ? 'text-red-600 text-[13px]' : 'text-slate-900'}`}>{patient.sampleCode || patient.code}</td>
          </tr>
          <tr>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Giới tính:</td>
            <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle">{patient.gender || 'Nam'}</td>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Tình trạng mẫu</td>
            <td className="py-1.5 px-3 font-medium text-emerald-700 font-bold border-b border-slate-300 align-middle">{patient.sampleStatus || 'Đạt'}</td>
          </tr>
          <tr>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Số điện thoại</td>
            <td className="py-1.5 px-3 font-mono text-slate-800 border-r border-b border-slate-300 align-middle">{patient.phone || '---'}</td>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">T/G nhận mẫu</td>
            <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle">{patient.receivedAt || new Date().toLocaleDateString('vi-VN')}</td>
          </tr>
          <tr>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Bác sĩ chỉ định</td>
            <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-300 align-middle">{patient.doctor || doctorName || 'BS. Trần Hoài Long'}</td>
            <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle">T/G trả kết quả</td>
            <td className="py-1.5 px-3 font-medium text-slate-800 align-middle">{patient.returnedAt || new Date().toLocaleDateString('vi-VN')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});
