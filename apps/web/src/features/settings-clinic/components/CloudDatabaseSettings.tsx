import React, { useState, useRef } from 'react';
import {
  Database, Download, FileJson, RefreshCw, Camera,
  History, Loader2, RotateCcw, Trash2
} from 'lucide-react';
import { CloudDbConfig, ToastType } from '@domain/types';
import {
  testSupabaseConnection,
  seedAllDefaultDataToSupabase,
  backupAllDataFromSupabase,
  restoreAllDataToSupabase,
  listCloudSnapshots,
  createCloudSnapshot,
  restoreCloudSnapshot,
  deleteCloudSnapshot,
  CloudSnapshotSummary
} from '@infra/cloudDbService';

interface CloudDatabaseSettingsProps {
  localCloudConfig: CloudDbConfig;
  setLocalCloudConfig: React.Dispatch<React.SetStateAction<CloudDbConfig>>;
  showToast: (message: string, type?: ToastType) => void;
}

export const CloudDatabaseSettings: React.FC<CloudDatabaseSettingsProps> = ({
  localCloudConfig,
  setLocalCloudConfig,
  showToast
}) => {
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [isSeedingData, setIsSeedingData] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileRestoreInputRef = useRef<HTMLInputElement>(null);

  // Snapshot Management State
  const [snapshots, setSnapshots] = useState<CloudSnapshotSummary[]>([]);
  const [hasLoadedSnapshots, setHasLoadedSnapshots] = useState(false);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);

  const loadSnapshotsList = async () => {
    setIsLoadingSnapshots(true);
    const list = await listCloudSnapshots();
    setSnapshots(list);
    setHasLoadedSnapshots(true);
    setIsLoadingSnapshots(false);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
        <Database className="w-4 h-4 text-emerald-600" />
        <span>Cấu Hình Supabase Cloud Database</span>
      </h4>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="cloud-enabled"
          checked={localCloudConfig.enabled}
          onChange={(e) => setLocalCloudConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
          className="w-4 h-4 text-emerald-600 rounded"
        />
        <label htmlFor="cloud-enabled" className="font-semibold text-slate-700">
          Kích hoạt kết nối Cloud DB (Supabase)
        </label>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Project URL (Supabase)</label>
        <input
          type="text"
          placeholder="https://xyzcompany.supabase.co"
          value={localCloudConfig.supabaseUrl}
          onChange={(e) => setLocalCloudConfig((prev) => ({ ...prev, supabaseUrl: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Anon Public Key</label>
        <input
          type="password"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          value={localCloudConfig.supabaseAnonKey}
          onChange={(e) => setLocalCloudConfig((prev) => ({ ...prev, supabaseAnonKey: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* CÔNG CỤ SAO LƯU & QUẢN TRỊ DATABASE */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Công Cụ Sao Lưu Ngoại Tuyến &amp; Quản Trị</span>
          </h5>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isTestingCloud || isBackingUp}
            onClick={async () => {
              setIsTestingCloud(true);
              const res = await testSupabaseConnection(localCloudConfig);
              setIsTestingCloud(false);
              showToast(res.message, res.success ? 'success' : 'error');
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span>{isTestingCloud ? 'Đang Kiểm Tra...' : 'Kiểm Tra Kết Nối'}</span>
          </button>

          <button
            type="button"
            disabled={isBackingUp}
            onClick={async () => {
              setIsBackingUp(true);
              showToast('Đang tạo file sao lưu JSON toàn diện...', 'info');
              const res = await backupAllDataFromSupabase(localCloudConfig);
              setIsBackingUp(false);
              showToast(res.message, res.success ? 'success' : 'error');
            }}
            className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>{isBackingUp ? 'Đang Xuất File...' : 'Tải File Backup JSON'}</span>
          </button>

          <label className="cursor-pointer px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 transition shadow-xs">
            <FileJson className="w-3 h-3" />
            <span>{isRestoring ? 'Đang Khôi Phục...' : 'Khôi Phục Từ File Backup'}</span>
            <input
              ref={fileRestoreInputRef}
              type="file"
              accept=".json,application/json"
              disabled={isRestoring}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                setIsRestoring(true);
                showToast('Đang khôi phục dữ liệu lên Supabase...', 'info');
                const res = await restoreAllDataToSupabase(text, localCloudConfig);
                setIsRestoring(false);
                showToast(res.message, res.success ? 'success' : 'error');
                if (fileRestoreInputRef.current) fileRestoreInputRef.current.value = '';
              }}
              className="hidden"
            />
          </label>

          <button
            type="button"
            disabled={isSeedingData}
            onClick={async () => {
              if (!window.confirm('Thao tác này sẽ nạp lại bộ dữ liệu mẫu mặc định gốc (167+ chỉ số, gói XN, nhóm, thiết bị) lên Cloud. Tiếp tục?')) {
                return;
              }
              setIsSeedingData(true);
              showToast('Đang đẩy danh mục gốc (167+ chỉ số, gói XN, nhóm) lên Supabase...', 'info');
              const res = await seedAllDefaultDataToSupabase(localCloudConfig);
              setIsSeedingData(false);
              showToast(res.message, res.success ? 'success' : 'error');
            }}
            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-[11px] flex items-center gap-1 transition disabled:opacity-50 cursor-pointer ml-auto"
          >
            <RefreshCw className="w-3 h-3 text-slate-600" />
            <span>Nạp Dữ Liệu Gốc</span>
          </button>
        </div>
      </div>

      {/* KHUNG QUẢN LÝ SNAPSHOT DATABASE 1-CLICK */}
      <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 border-2 border-indigo-200/80 rounded-xl p-3.5 space-y-3 shadow-xs mt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 text-indigo-950">
              <Camera className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>Quản Lý Snapshot &amp; Đóng Băng Database (1-Click)</span>
            </h5>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              Tạo các bản chụp trạng thái (Snapshot) toàn bộ 12 bảng để khôi phục (Rollback) tức thì khi có sự cố.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              const snapName = window.prompt('Nhập tên gợi nhớ cho bản Snapshot (Ví dụ: Trước khi cập nhật danh mục):', `Snapshot_${new Date().toLocaleDateString('vi-VN')}`);
              if (!snapName) return;
              setIsCreatingSnapshot(true);
              showToast('Đang tạo bản Snapshot trên Cloud DB...', 'info');
              const res = await createCloudSnapshot(snapName, 'Tạo từ Giao diện Cài đặt');
              setIsCreatingSnapshot(false);
              showToast(res.message, res.success ? 'success' : 'error');
              if (res.success) {
                loadSnapshotsList();
              }
            }}
            disabled={isCreatingSnapshot}
            className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCreatingSnapshot ? 'Đang Chụp...' : '📸 Chụp Snapshot'}</span>
          </button>
        </div>

        {/* Danh sách các bản Snapshot đã lưu */}
        <div className="pt-2 border-t border-indigo-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
              <History className="w-3 h-3 text-slate-500" />
              <span>Lịch Sử Các Bản Snapshot ({snapshots.length})</span>
            </span>
            <button
              type="button"
              onClick={loadSnapshotsList}
              disabled={isLoadingSnapshots}
              className="text-[10.5px] text-indigo-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isLoadingSnapshots ? 'animate-spin' : ''}`} />
              <span>{hasLoadedSnapshots ? 'Tải lại danh sách' : 'Xem danh sách Snapshot'}</span>
            </button>
          </div>

          {!hasLoadedSnapshots ? (
            <button
              type="button"
              onClick={loadSnapshotsList}
              className="w-full py-2 bg-white/80 border border-dashed border-indigo-300 rounded-lg text-slate-600 hover:text-indigo-800 hover:bg-white text-center font-medium transition cursor-pointer text-[11px]"
            >
              Bấm để tải danh sách các bản Snapshot hiện có từ Cloud DB
            </button>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-2 text-slate-400 italic text-[11px]">
              Chưa có bản Snapshot nào được lưu trên Cloud DB.
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {snapshots.map((s) => (
                <div
                  key={s.id}
                  className="bg-white/90 border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2 text-[11px] hover:border-indigo-300 transition"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(s.createdAt).toLocaleString('vi-VN')} {s.createdBy ? `• Tạo bởi: ${s.createdBy}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={restoringSnapshotId === s.id}
                      onClick={async () => {
                        if (!window.confirm(`Bạn có chắc muốn KHÔI PHỤC toàn bộ dữ liệu database về bản snapshot "${s.name}"? Dữ liệu hiện tại sẽ được thay thế bằng dữ liệu tại thời điểm chụp.`)) {
                          return;
                        }
                        setRestoringSnapshotId(s.id);
                        showToast('Đang khôi phục dữ liệu database...', 'info');
                        const res = await restoreCloudSnapshot(s.id);
                        setRestoringSnapshotId(null);
                        showToast(res.message, res.success ? 'success' : 'error');
                        if (res.success) {
                          window.location.reload();
                        }
                      }}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] flex items-center gap-1 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {restoringSnapshotId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      <span>Khôi phục</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Xóa bản snapshot "${s.name}"?`)) return;
                        const res = await deleteCloudSnapshot(s.id);
                        showToast(res.message, res.success ? 'success' : 'error');
                        if (res.success) {
                          loadSnapshotsList();
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                      title="Xóa snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
