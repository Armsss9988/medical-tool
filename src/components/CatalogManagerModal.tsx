import React, { useState } from 'react';
import { X, Database, Plus, Trash2, Edit3, Save } from 'lucide-react';
import { CatalogItem, TestPackage, TestGroup, TestEquipment, Doctor } from '@domain/types';
import { ManageCatalogUseCase } from '../usecases/ManageCatalogUseCase';

interface CatalogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  onSaveCatalog: (catalog: CatalogItem[]) => void;
  testPackages: TestPackage[];
  onSavePackages: (pkgs: TestPackage[]) => void;
  testGroups: TestGroup[];
  onSaveTestGroups: (groups: TestGroup[]) => void;
  equipments: TestEquipment[];
  onSaveEquipments: (eqs: TestEquipment[]) => void;
  doctorsList: Doctor[];
  onSaveDoctors: (docs: Doctor[]) => void;
}

export default function CatalogManagerModal({
  isOpen,
  onClose,
  catalog,
  onSaveCatalog,
  testPackages,
  onSavePackages,
  testGroups,
  onSaveTestGroups,
  equipments,
  onSaveEquipments,
  doctorsList,
  onSaveDoctors
}: CatalogManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'packages' | 'groups' | 'equipments' | 'doctors'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const catalogUseCase = new ManageCatalogUseCase();

  const handleDeleteGroup = (groupId: string) => {
    const res = catalogUseCase.canDeleteGroup(groupId, testGroups, catalog);
    if (!res.canDelete) {
      alert(res.message);
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa nhóm này?')) {
      onSaveTestGroups(testGroups.filter((g) => g.id !== groupId));
    }
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    const res = catalogUseCase.canDeleteEquipment(equipmentId, equipments, catalog);
    if (!res.canDelete) {
      alert(res.message);
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      onSaveEquipments(equipments.filter((e) => e.id !== equipmentId));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base">Quản Lý Danh Mục, Gói Xét Nghiệm & Bác Sĩ</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 space-x-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-t-lg transition border-b-2 ${
              activeTab === 'catalog'
                ? 'bg-white text-emerald-700 border-emerald-600 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Chỉ Số ({catalog.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2.5 rounded-t-lg transition border-b-2 ${
              activeTab === 'packages'
                ? 'bg-white text-emerald-700 border-emerald-600 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Gói Xét Nghiệm ({testPackages.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2.5 rounded-t-lg transition border-b-2 ${
              activeTab === 'groups'
                ? 'bg-white text-emerald-700 border-emerald-600 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Nhóm Xét Nghiệm ({testGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('equipments')}
            className={`px-4 py-2.5 rounded-t-lg transition border-b-2 ${
              activeTab === 'equipments'
                ? 'bg-white text-emerald-700 border-emerald-600 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Thiết Bị Xử Lý ({equipments.length})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 rounded-t-lg transition border-b-2 ${
              activeTab === 'doctors'
                ? 'bg-white text-emerald-700 border-emerald-600 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Bác Sĩ ({doctorsList.length})
          </button>
        </div>

        {/* CONTENT TAB */}
        <div className="p-6 overflow-y-auto flex-grow text-xs space-y-4">
          {activeTab === 'catalog' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Lọc chỉ số..."
                  className="px-3 py-1.5 border rounded-lg w-64 text-xs"
                />
                <span className="text-slate-500 font-medium">Tổng số: {catalog.length} chỉ số</span>
              </div>
              <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b">
                    <tr>
                      <th className="p-2">Mã</th>
                      <th className="p-2">Tên Chỉ Số</th>
                      <th className="p-2">Nhóm</th>
                      <th className="p-2">Đơn Vị</th>
                      <th className="p-2">Tham Chiếu</th>
                      <th className="p-2 text-right">Đơn Giá (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catalog
                      .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((item) => (
                        <tr key={item.code} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-slate-800">{item.code}</td>
                          <td className="p-2 font-semibold text-slate-900">{item.name}</td>
                          <td className="p-2 text-slate-600">{item.category}</td>
                          <td className="p-2 text-slate-600">{item.unit || '-'}</td>
                          <td className="p-2 text-slate-600">{item.refText || '-'}</td>
                          <td className="p-2 text-right font-mono font-semibold text-emerald-700">
                            {item.price ? item.price.toLocaleString('vi-VN') + ' đ' : '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Danh Sách Nhóm Xét Nghiệm</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {testGroups.map((g) => (
                  <div key={g.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <span className="font-bold text-slate-900">{g.name}</span>
                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Xóa nhóm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'equipments' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Danh Sách Thiết Bị Xử Lý</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {equipments.map((e) => (
                  <div key={e.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <span className="font-bold text-slate-900">{e.name}</span>
                    <button
                      onClick={() => handleDeleteEquipment(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Xóa thiết bị"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Toàn bộ thay đổi tự động lưu an toàn</span>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
