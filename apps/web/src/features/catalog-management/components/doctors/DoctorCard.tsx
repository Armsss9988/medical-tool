import { Stethoscope, Phone, Briefcase, Edit2, Trash2 } from 'lucide-react';
import { Doctor } from '@domain/types';

interface DoctorCardProps {
  doctor: Doctor;
  onEdit: (doc: Doctor) => void;
  onDelete: (id: string, name: string) => void;
}

function getInitials(name: string): string {
  const words = name.trim().replace(/^BS\.?\s*|^BSCK[I|II]*\s*/i, '').split(/\s+/);
  if (words.length === 0 || !words[0]) return 'BS';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}

export function DoctorCard({ doctor, onEdit, onDelete }: DoctorCardProps) {
  const initials = getInitials(doctor.name);

  return (
    <div className="p-4 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md rounded-2xl transition duration-150 flex flex-col justify-between gap-3 group">
      {/* Top row: Avatar + Name + Action buttons */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 tracking-wider">
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 truncate group-hover:text-emerald-700 transition">
              {doctor.name}
            </h4>
            <span className="text-[10px] font-mono text-slate-400">ID: {doctor.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={() => onEdit(doctor)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
            title="Sửa thông tin bác sĩ"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(doctor.id, doctor.name)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Xóa bác sĩ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Details: Specialty & Phone */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-600 text-xs truncate">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{doctor.specialty || 'Bác sĩ Đa khoa / Xét nghiệm'}</span>
        </div>

        {doctor.phone ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <a
              href={`tel:${doctor.phone}`}
              className="font-mono text-emerald-700 hover:underline font-medium"
            >
              {doctor.phone}
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
            <Stethoscope className="w-3.5 h-3.5 opacity-40 shrink-0" />
            <span>Chưa cập nhật số điện thoại</span>
          </div>
        )}
      </div>
    </div>
  );
}
