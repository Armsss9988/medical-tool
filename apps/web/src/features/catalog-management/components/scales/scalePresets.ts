export interface ColorPreset {
  key: string;
  label: string;
  bgClass: string;
  textClass: string;
  hex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { key: 'white', label: 'Trắng / Âm tính', bgClass: 'bg-white border-slate-300 text-slate-700', textClass: 'text-slate-700', hex: '#FFFFFF' },
  { key: 'emerald-light', label: 'Xanh ngọc nhạt', bgClass: 'bg-emerald-50 border-emerald-300 text-emerald-800', textClass: 'text-emerald-800', hex: '#ECFDF5' },
  { key: 'amber-light', label: 'Vàng nhạt (Độ 1)', bgClass: 'bg-amber-100 border-amber-300 text-amber-900', textClass: 'text-amber-900', hex: '#FEF3C7' },
  { key: 'amber', label: 'Vàng cam (Độ 2)', bgClass: 'bg-amber-200 border-amber-400 text-amber-950', textClass: 'text-amber-950', hex: '#FDE68A' },
  { key: 'orange', label: 'Cam (Độ 3)', bgClass: 'bg-orange-200 border-orange-400 text-orange-950', textClass: 'text-orange-950', hex: '#FED7AA' },
  { key: 'red-light', label: 'Đỏ nhạt (Độ 3/4)', bgClass: 'bg-rose-100 border-rose-300 text-rose-900', textClass: 'text-rose-900', hex: '#FFE4E6' },
  { key: 'red', label: 'Đỏ tươi (Độ 4)', bgClass: 'bg-rose-300 border-rose-500 text-rose-950', textClass: 'text-rose-950', hex: '#FDA4AF' },
  { key: 'red-bold', label: 'Đỏ đậm (Độ 5)', bgClass: 'bg-rose-500 border-rose-600 text-white', textClass: 'text-white', hex: '#F43F5E' },
  { key: 'red-extreme', label: 'Cực mạnh / Tím đỏ (Độ 6)', bgClass: 'bg-purple-700 border-purple-800 text-white', textClass: 'text-white', hex: '#7E22CE' }
];
