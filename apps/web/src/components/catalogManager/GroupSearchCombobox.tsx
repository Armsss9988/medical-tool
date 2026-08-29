import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { TestGroup } from '@domain/types';

export interface GroupSearchComboboxProps {
  value: string;
  onChange: (groupName: string) => void;
  groups: TestGroup[];
  onCreateGroup: (name: string) => void;
  onDeleteGroup?: (id: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export default function GroupSearchCombobox({
  value = '',
  onChange,
  groups,
  onCreateGroup,
  onDeleteGroup,
  placeholder = 'Tìm hoặc tạo nhóm...',
  compact = false
}: GroupSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const exactMatch = groups.some((g) => g.name.toLowerCase() === (searchTerm || '').toLowerCase());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (name: string) => {
    setSearchTerm(name);
    onChange(name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = (searchTerm || '').trim();
      if (!trimmed) return;
      if (exactMatch) {
        onChange(trimmed);
        setIsOpen(false);
      } else {
        setPendingName(trimmed);
        setShowCreateDialog(true);
        setIsOpen(false);
      }
    }
  };

  const handleConfirmCreate = () => {
    onCreateGroup(pendingName);
    onChange(pendingName);
    setSearchTerm(pendingName);
    setShowCreateDialog(false);
  };

  const inputCls = compact
    ? 'w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 rounded px-2 py-1 font-semibold text-slate-800 text-xs transition-all focus:outline-none'
    : 'w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-medium text-xs focus:border-sky-600 focus:outline-none';

  return (
    <>
      <div ref={wrapperRef} className="relative w-full">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-1 text-slate-400 hover:text-slate-600 p-0.5"
            tabIndex={-1}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-2 text-center text-slate-400 text-xs">
                {searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingName(searchTerm.trim());
                      setShowCreateDialog(true);
                      setIsOpen(false);
                    }}
                    className="text-sky-600 hover:underline font-bold"
                  >
                    + Tạo nhóm mới "{searchTerm.trim()}"
                  </button>
                ) : (
                  'Không có nhóm nào'
                )}
              </div>
            ) : (
              <div className="p-1 space-y-0.5">
                {filtered.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between px-2.5 py-1.5 hover:bg-sky-50 rounded cursor-pointer group"
                    onClick={() => handleSelect(g.name)}
                  >
                    <span className="text-slate-800 font-medium text-xs">{g.name}</span>
                    {onDeleteGroup && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Xóa nhóm "${g.name}"?`)) onDeleteGroup(g.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {searchTerm.trim() && !exactMatch && (
                  <div
                    className="border-t border-slate-100 px-2.5 py-1.5 hover:bg-emerald-50 rounded cursor-pointer text-emerald-700 font-bold text-xs"
                    onClick={() => {
                      setPendingName(searchTerm.trim());
                      setShowCreateDialog(true);
                      setIsOpen(false);
                    }}
                  >
                    + Tạo nhóm mới "{searchTerm.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Tạo Nhóm Xét Nghiệm Mới</h4>
            <input
              type="text"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              placeholder="Tên nhóm xét nghiệm..."
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 font-bold text-xs focus:bg-white focus:border-sky-600 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="px-3 py-1 text-slate-600 font-medium text-xs hover:bg-slate-100 rounded"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!pendingName.trim()}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded disabled:opacity-50"
              >
                Tạo Nhóm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
