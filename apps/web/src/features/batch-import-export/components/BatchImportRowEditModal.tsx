import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, User, Activity } from 'lucide-react';
import { BatchImportRow, Doctor, ImportRowAction, SelectedTest, Gender } from '@domain';
import { evaluateTestIndicator } from '@domain/testResult';

interface BatchImportRowEditModalProps {
  row: BatchImportRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (targetId: string, updatedRow: BatchImportRow) => void;
  doctorsList?: Doctor[];
}

export const BatchImportRowEditModal: React.FC<BatchImportRowEditModalProps> = ({
  row,
  isOpen,
  onClose,
  onSave,
  doctorsList = []
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [patientGender, setPatientGender] = useState<Gender>('Nam');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientDiagnosis, setPatientDiagnosis] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [action, setAction] = useState<ImportRowAction>('CREATE_NEW');
  const [tests, setTests] = useState<SelectedTest[]>([]);

  useEffect(() => {
    if (row) {
      setPatientName(row.patient.name || '');
      setPatientCode(row.patient.code || '');
      setPatientDob(row.patient.dob || '');
      setPatientGender((row.patient.gender as Gender) || 'Nam');
      setPatientPhone(row.patient.phone || '');
      setPatientAddress(row.patient.address || '');
      setPatientDiagnosis(row.patient.diagnosis || '');
      setDoctorName(row.doctorName || '');
      setConclusion(row.conclusion || '');
      setAction(row.action || 'CREATE_NEW');
      setTests([...row.selectedTests]);
    }
  }, [row]);

  if (!isOpen || !row) return null;

  const handleTestResultChange = (testIdx: number, newResult: string) => {
    setTests((prev) => {
      const next = [...prev];
      const t = next[testIdx];
      const evalRes = evaluateTestIndicator(
        t.code,
        t.category,
        t.unit,
        newResult,
        t.refMin,
        t.refMax,
        undefined,
        undefined,
        t.evaluationType
      );
      next[testIdx] = {
        ...t,
        result: newResult,
        note: evalRes.label || (t.evaluationType === 'detection' && (!newResult || newResult.trim() === '') ? '' : (newResult ? 'Bình thường' : ''))
      };
      return next;
    });
  };

  const handleRemoveTest = (testIdx: number) => {
    setTests((prev) => prev.filter((_, i) => i !== testIdx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!row.id) return;

    const updatedRow: BatchImportRow = {
      ...row,
      patient: {
        ...row.patient,
        name: patientName.trim().toUpperCase(),
        code: patientCode.trim(),
        dob: patientDob.trim(),
        gender: patientGender,
        phone: patientPhone.trim(),
        address: patientAddress.trim(),
        diagnosis: patientDiagnosis.trim()
      },
      doctorName: doctorName.trim(),
      conclusion: conclusion.trim(),
      action,
      selectedTests: tests
    };

    onSave(row.id, updatedRow);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm">
            <User className="w-4 h-4 text-sky-400" />
            <span>Chỉnh Sửa Dữ Liệu Bệnh Nhân: <span className="text-sky-300 uppercase">{patientName || '---'}</span></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 text-xs">
          {/* PATIENT INFO GRID */}
          <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-3.5 space-y-3">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <span>Thông tin hành chính bệnh nhân</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Mã BN</label>
                <input
                  type="text"
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sky-300 font-mono focus:border-sky-500 focus:outline-none"
                  placeholder="Tự sinh nếu rỗng"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Họ và Tên (*)</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold uppercase focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Năm Sinh</label>
                <input
                  type="text"
                  value={patientDob}
                  onChange={(e) => setPatientDob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                  placeholder="VD: 1990"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Giới Tính</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as Gender)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Số Điện Thoại</label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                  placeholder="09..."
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bác Sĩ Chỉ Định</label>
                <input
                  type="text"
                  list="modal-doctors-list"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
                <datalist id="modal-doctors-list">
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Địa Chỉ / Đơn Vị Công Ty</label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Hành Động Khi Nhập</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as ImportRowAction)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="CREATE_NEW">Thêm mới phiếu</option>
                  <option value="OVERWRITE">Ghi đè phiếu cũ</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-400 font-semibold mb-1">Chẩn Đoán / Lý Do Khám</label>
                <input
                  type="text"
                  value={patientDiagnosis}
                  onChange={(e) => setPatientDiagnosis(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* TESTS LIST */}
          <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Danh sách kết quả chỉ số ({tests.length})</span>
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-700/60 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800 text-slate-300 sticky top-0 text-[11px]">
                  <tr>
                    <th className="p-2 w-28">Mã</th>
                    <th className="p-2">Tên Chỉ Số</th>
                    <th className="p-2 w-32">Kết Quả</th>
                    <th className="p-2 w-24">Đơn Vị</th>
                    <th className="p-2 w-32">Tham Chiếu</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px]">
                  {tests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                        Chưa có chỉ số nào trong danh sách.
                      </td>
                    </tr>
                  ) : (
                    tests.map((t, idx) => (
                      <tr key={t.code || idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-mono font-bold text-sky-400">{t.code}</td>
                        <td className="p-2 text-white font-medium">{t.name}</td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={t.result || ''}
                            onChange={(e) => handleTestResultChange(idx, e.target.value)}
                            placeholder="Nhập..."
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-emerald-300 font-bold focus:border-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-slate-400">{t.unit || '---'}</td>
                        <td className="p-2 text-slate-400 truncate max-w-[120px]">{t.refText || '---'}</td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                            title="Xóa chỉ số này"
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
          </div>

          {/* FOOTER BUTTONS */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
