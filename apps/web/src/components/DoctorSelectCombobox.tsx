import { useState } from 'react';
import { ChevronDown, Check, UserPlus } from 'lucide-react';
import { Doctor } from '@domain/types';

interface DoctorSelectComboboxProps {
  doctorsList?: Doctor[];
  selectedDoctor: string;
  onSelectDoctor: (doctorName: string) => void;
  onOpenDoctorModal?: () => void;
}

export default function DoctorSelectCombobox({
  doctorsList = [],
  selectedDoctor,
  onSelectDoctor,
  onOpenDoctorModal
}: DoctorSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDoctors = doctorsList.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.specialty && doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="relative w-full text-xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg flex items-center justify-between cursor-pointer hover:border-slate-400 transition"
      >
        <span className="font-bold text-slate-900">{selectedDoctor || 'BS. Trần Hoài Long'}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc chuyên khoa..."
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-1 font-medium"
            autoFocus
          />

          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredDoctors.length === 0 ? (
              <div className="p-2 text-center text-slate-400">Không tìm thấy bác sĩ</div>
            ) : (
              filteredDoctors.map((doc, idx) => {
                const isSelected = selectedDoctor === doc.name;
                return (
                  <div
                    key={doc.id ? `${doc.id}-${idx}` : `doc-${idx}`}
                    onClick={() => {
                      onSelectDoctor(doc.name);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold">{doc.name}</span>
                      {doc.specialty && (
                        <span className="block text-[10px] text-slate-500 font-normal">{doc.specialty}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {onOpenDoctorModal && (
            <div className="pt-1.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDoctorModal();
                }}
                className="w-full py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg transition-all flex items-center justify-center space-x-1 text-[11px]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Quản Lý Danh Mục Bác Sĩ</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
