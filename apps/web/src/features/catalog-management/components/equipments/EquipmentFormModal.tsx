import { useState, useEffect } from 'react';
import { X, Save, Cpu } from 'lucide-react';
import { TestEquipment } from '@domain/types';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: TestEquipment | null;
  onSave: (equipment: TestEquipment) => void;
}

export function EquipmentFormModal({
  isOpen,
  onClose,
  initialData,
  onSave
}: EquipmentFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code || '');
    } else {
      setName('');
      setCode('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialData && (!code || code === generateCode(name))) {
      setCode(generateCode(val));
    }
    if (error) setError('');
  };

  const generateCode = (str: string) => {
    return str
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 15);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập tên thiết bị.');
      return;
    }

    onSave({
      id: initialData?.id || crypto.randomUUID(),
      name: trimmedName,
      code: code.trim() ? code.trim().toUpperCase() : generateCode(trimmedName)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm">
              {initialData ? 'Chỉnh Sửa Thiết Bị' : 'Thêm Thiết Bị Mới'}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên thiết bị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="VD: Mindray BC-5000, Dirui CS-600B..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mã thiết bị (Ký hiệu hệ thống)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: BC-5000, CS-600B..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{initialData ? 'Cập Nhật' : 'Tạo Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
