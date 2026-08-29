import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';

export interface NoteOption {
  label: string;
  badgeClass?: string;
  desc?: string;
}

const ALLERGEN_NOTE_OPTIONS: NoteOption[] = [
  { label: 'Độ 0 (Âm tính)', badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  { label: 'Độ 1 (Yếu)', badgeClass: 'text-amber-700 bg-amber-50 border border-amber-200' },
  { label: 'Độ 2 (Trung bình)', badgeClass: 'text-orange-700 bg-orange-50 border border-orange-200' },
  { label: 'Độ 3 (Khá)', badgeClass: 'text-orange-800 bg-orange-100 border border-orange-300' },
  { label: 'Độ 4 (Mạnh)', badgeClass: 'text-rose-700 bg-rose-50 border border-rose-200' },
  { label: 'Độ 5 (Rất mạnh)', badgeClass: 'text-rose-800 bg-rose-100 border border-rose-300' },
  { label: 'Độ 6 (Cực mạnh)', badgeClass: 'text-red-900 bg-red-100 border border-red-300 font-bold' },
  { label: 'Âm tính', badgeClass: 'text-emerald-700 bg-emerald-50' },
  { label: 'Dương tính', badgeClass: 'text-rose-700 bg-rose-50 font-bold' },
  { label: 'Nghi ngờ', badgeClass: 'text-amber-700 bg-amber-50' },
  { label: 'Bình thường', badgeClass: 'text-slate-700 bg-slate-100' }
];

const GENERAL_NOTE_OPTIONS: NoteOption[] = [
  { label: 'Bình thường', badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  { label: 'CAO ↑', badgeClass: 'text-rose-700 bg-rose-50 border border-rose-200 font-bold' },
  { label: 'THẤP ↓', badgeClass: 'text-blue-700 bg-blue-50 border border-blue-200 font-bold' },
  { label: 'H (Tăng)', badgeClass: 'text-rose-700 bg-rose-50 font-bold' },
  { label: 'L (Giảm)', badgeClass: 'text-blue-700 bg-blue-50 font-bold' },
  { label: 'Âm tính', badgeClass: 'text-emerald-700 bg-emerald-50' },
  { label: 'Dương tính', badgeClass: 'text-rose-700 bg-rose-50 font-bold' },
  { label: 'Vết (Trace)', badgeClass: 'text-amber-700 bg-amber-50' },
  { label: 'Nghi ngờ', badgeClass: 'text-amber-700 bg-amber-50' },
  { label: 'Mẫu tán huyết', badgeClass: 'text-slate-600 bg-slate-100' },
  { label: 'Mẫu đục / mỡ', badgeClass: 'text-slate-600 bg-slate-100' }
];

interface NoteComboboxProps {
  value: string;
  onChange: (val: string) => void;
  isAllergen?: boolean;
  isAbnormal?: boolean;
  placeholder?: string;
}

export default function NoteCombobox({
  value = '',
  onChange,
  isAllergen = false,
  isAbnormal = false,
  placeholder = 'Ghi chú / Đánh giá...'
}: NoteComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseOptions = isAllergen ? ALLERGEN_NOTE_OPTIONS : GENERAL_NOTE_OPTIONS;

  // Filter options only when user is actively searching with filterText
  const visibleOptions = useMemo(() => {
    if (!filterText.trim()) return baseOptions;
    const query = filterText.toLowerCase().trim();
    const matches = baseOptions.filter((opt) => opt.label.toLowerCase().includes(query));
    return matches.length > 0 ? matches : baseOptions;
  }, [baseOptions, filterText]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFilterText('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (optionLabel: string) => {
    onChange(optionLabel);
    setIsOpen(false);
    setFilterText('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            const newVal = e.target.value;
            onChange(newVal);
            setFilterText(newVal);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setFilterText('');
          }}
          placeholder={placeholder}
          className={`w-full pr-7 px-2 py-1.5 min-h-[36px] border rounded-lg text-xs font-semibold focus:outline-none transition-all ${
            isAbnormal
              ? 'bg-red-50 border-red-300 text-red-700 font-bold focus:ring-2 focus:ring-red-200'
              : 'bg-white hover:bg-slate-50 focus:bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-2xs'
          }`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
            setFilterText('');
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className="absolute right-1 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer transition"
          tabIndex={-1}
          title="Bấm để xem toàn bộ danh sách tùy chọn"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 min-w-[200px] w-full top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              {isAllergen ? 'Thang Độ Dị Ứng IgE' : 'Tùy Chọn Đánh Giá'}
            </span>
            <span className="text-slate-400 font-normal">({visibleOptions.length})</span>
          </div>

          <div className="space-y-0.5 pt-0.5">
            {visibleOptions.map((opt, idx) => {
              const isSelected = value === opt.label;
              return (
                <div
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectOption(opt.label);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${opt.badgeClass || ''}`}>
                    {opt.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
