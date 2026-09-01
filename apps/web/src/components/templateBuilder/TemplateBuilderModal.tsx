import { useState, useCallback, useRef, memo } from 'react';
import {
  Palette,
  Eye,
  Settings2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Plus,
  Trash2,
  Download,
  Upload,
  Check,
  Star,
  X
} from 'lucide-react';
import {
  Patient,
  SelectedTest,
  ClinicInfo,
  TestPackage,
  AllergenGradingScale,
  TestEquipment,
  CatalogItemEquipmentLink
} from '@domain';
import { TemplateBlock, TemplateBlockType } from '@domain/templateTypes';
import { useTemplateManager } from '../../hooks/useTemplateManager';
import TemplatePalette from './TemplatePalette';
import TemplateCanvas from './TemplateCanvas';
import TemplateInspector from './TemplateInspector';

interface TemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  selectedTests: SelectedTest[];
  clinicInfo: ClinicInfo;
  doctorName?: string;
  conclusion?: string;
  qrCodeDataUrl?: string;
  testPackages?: TestPackage[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  allergenScales?: AllergenGradingScale[];
  onShowToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function TemplateBuilderModal({
  isOpen,
  onClose,
  patient,
  selectedTests,
  clinicInfo,
  doctorName,
  conclusion,
  qrCodeDataUrl,
  testPackages = [],
  equipments = [],
  catalogItemEquipments = [],
  allergenScales = [],
  onShowToast
}: TemplateBuilderModalProps) {
  const {
    templates,
    activeTemplateId,
    activeTemplate,
    selectActiveTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setDefaultTemplate,
    addBlockToTemplate,
    removeBlockFromTemplate,
    reorderBlockInTemplate,
    updateBlockInTemplate,
    exportTemplateJson,
    importTemplateJson,
    resetToPresets
  } = useTemplateManager();

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(0.75);
  const [isDesignMode, setIsDesignMode] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.1, 1.4));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.1, 0.4));
  const handleResetZoom = () => setZoomScale(0.75);

  const handleAddBlock = useCallback(
    (type: TemplateBlockType) => {
      addBlockToTemplate(activeTemplate.id, type);
      onShowToast?.(`Đã thêm khối mới vào mẫu in`, 'success');
    },
    [addBlockToTemplate, activeTemplate.id, onShowToast]
  );

  const handleRemoveBlock = useCallback(
    (blockId: string) => {
      removeBlockFromTemplate(activeTemplate.id, blockId);
      if (selectedBlockId === blockId) setSelectedBlockId(null);
      onShowToast?.(`Đã xóa khối khỏi mẫu`, 'info');
    },
    [removeBlockFromTemplate, activeTemplate.id, selectedBlockId, onShowToast]
  );

  const handleReorderBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      reorderBlockInTemplate(activeTemplate.id, blockId, direction);
    },
    [reorderBlockInTemplate, activeTemplate.id]
  );

  const handleUpdateBlock = useCallback(
    (blockId: string, updates: Partial<TemplateBlock>) => {
      updateBlockInTemplate(activeTemplate.id, blockId, updates);
    },
    [updateBlockInTemplate, activeTemplate.id]
  );

  /**
   * Xử lý kéo thả từ palette: thêm block mới sau vị trí `afterBlockId`.
   * Nếu afterBlockId không có, thêm vào cuối mẫu.
   */
  const handleDropBlock = useCallback(
    (blockType: string, afterBlockId?: string) => {
      addBlockToTemplate(activeTemplate.id, blockType as import('@domain/templateTypes').TemplateBlockType, afterBlockId);
      onShowToast?.(`Đã thêm khối mới vào mẫu in`, 'success');
    },
    [addBlockToTemplate, activeTemplate.id, onShowToast]
  );

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = importTemplateJson(content);
        if (imported) {
          onShowToast?.(`Đã nạp thành công mẫu in "${imported.name}"!`, 'success');
        } else {
          onShowToast?.(`File cấu hình JSON không hợp lệ!`, 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col w-full h-full overflow-hidden text-slate-100">
        
        {/* ─── TOP TOOLBAR ─── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/95 shrink-0 gap-3">
          {/* Left: Title & Preset Selector */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/30">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-slate-100">Trình Thiết Kế Mẫu Phiếu In</span>
                {activeTemplate.isDefault && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Star className="w-3 h-3 fill-amber-300" />
                    <span>Mặc Định</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <select
                  value={activeTemplateId}
                  onChange={(e) => {
                    selectActiveTemplate(e.target.value);
                    setSelectedBlockId(null);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-sky-300 outline-none cursor-pointer max-w-[280px] truncate"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.isDefault ? '★' : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    createTemplate();
                    setSelectedBlockId(null);
                    onShowToast?.(`Đã tạo mẫu mới`, 'success');
                  }}
                  title="Tạo Mẫu Mới"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    duplicateTemplate(activeTemplate.id);
                    onShowToast?.(`Đã nhân bản mẫu thành công`, 'success');
                  }}
                  title="Nhân Bản Mẫu Này"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {!activeTemplate.isDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultTemplate(activeTemplate.id);
                      onShowToast?.(`Đã đặt làm mẫu in mặc định`, 'success');
                    }}
                    title="Đặt Làm Mẫu Mặc Định"
                    className="p-1 rounded bg-slate-800 hover:bg-amber-600/30 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Khôi phục tất cả các mẫu in về mặc định ban đầu của GoLab?')) {
                      resetToPresets();
                      setSelectedBlockId(null);
                      onShowToast?.('Đã khôi phục tất cả mẫu chuẩn GoLab', 'success');
                    }
                  }}
                  title="Khôi Phục Tất Cả Mẫu Chuẩn GoLab"
                  className="p-1 rounded bg-slate-800 hover:bg-sky-800/50 text-slate-400 hover:text-sky-300 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {templates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa mẫu "${activeTemplate.name}"?`)) {
                        deleteTemplate(activeTemplate.id);
                        onShowToast?.(`Đã xóa mẫu`, 'info');
                      }
                    }}
                    title="Xóa Mẫu Này"
                    className="p-1 rounded bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Quick Add Block Dropdown */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddBlock(e.target.value as import('@domain/templateTypes').TemplateBlockType);
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-sky-950 border border-sky-600/80 text-xs font-bold text-sky-300 outline-none cursor-pointer hover:bg-sky-900 transition"
                >
                  <option value="">➕ Thêm khối...</option>
                  <optgroup label="── Khối Cơ Bản ──">
                    <option value="header">🏛️ Header Phòng Khám</option>
                    <option value="title">📋 Tiêu Đề Phiếu</option>
                    <option value="patient_info">👤 Thông Tin Bệnh Nhân</option>
                    <option value="test_table">🧪 Bảng Chỉ Số Xét Nghiệm</option>
                    <option value="conclusion">📝 Kết Luận & Lời Dặn</option>
                    <option value="signature">✍️ Chữ Ký & Con Dấu</option>
                  </optgroup>
                  <optgroup label="── Khối Dị Nguyên ──">
                    <option value="allergen_header">🛡️ Header Dị Nguyên</option>
                    <option value="allergen_title">📑 Tiêu Đề Định Lượng IgE</option>
                    <option value="allergen_patient_summary">👤 Thanh BN Tóm Tắt</option>
                    <option value="allergen_positive_table">⚠️ Bảng Dị Nguyên Dương Tính</option>
                    <option value="allergen_scale_table">📊 Bảng Thang Đo (+)</option>
                    <option value="allergen_symptoms_box">🚨 Khung Triệu Chứng</option>
                    <option value="allergen_tige_note">ℹ️ Ghi Chú TIgE</option>
                    <option value="allergen_detail_table">📋 Bảng Chi Tiết Dị Nguyên</option>
                    <option value="allergen_prevention_guide">📖 Hướng Dẫn Phòng Ngừa</option>
                    <option value="allergen_cover_summary">🔬 Tóm Tắt Gói Trang Bìa</option>
                  </optgroup>
                  <optgroup label="── Định Dạng ──">
                    <option value="page_break">📄 Ngắt Trang In A4</option>
                    <option value="custom_text">✏️ Văn Bản Tự Do</option>
                    <option value="divider">➖ Đường Kẻ Ngăn Cách</option>
                    <option value="spacer">↕️ Khoảng Đệm Trống</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Center: Mode Switcher & Zoom */}
          <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setIsDesignMode(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                isDesignMode ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Thiết Kế</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDesignMode(false);
                setSelectedBlockId(null);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                !isDesignMode ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem Thử</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 w-10 text-center font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Mặc định 75%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Nạp file JSON mẫu"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập JSON</span>
            </button>

            <button
              type="button"
              onClick={() => exportTemplateJson(activeTemplate)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Xuất file JSON mẫu để sao lưu"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition active:scale-95 cursor-pointer ml-2"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng &amp; Đóng</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── MAIN 3-PANEL WORKSPACE ─── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Component Palette */}
          {isDesignMode && (
            <TemplatePalette
              onAddBlock={handleAddBlock}
              existingBlocks={activeTemplate.blocks}
            />
          )}

          {/* Center: Interactive Canvas */}
          <TemplateCanvas
            template={activeTemplate}
            patient={patient}
            selectedTests={selectedTests}
            clinicInfo={clinicInfo}
            doctorName={doctorName}
            conclusion={conclusion}
            qrCodeDataUrl={qrCodeDataUrl}
            testPackages={testPackages}
            equipments={equipments}
            catalogItemEquipments={catalogItemEquipments}
            allergenScales={allergenScales}
            zoomScale={zoomScale}
            isDesignMode={isDesignMode}
            selectedBlockId={selectedBlockId}
            onSelectBlock={(id) => setSelectedBlockId(id)}
            onRemoveBlock={handleRemoveBlock}
            onReorderBlock={handleReorderBlock}
            onDropBlock={handleDropBlock}
          />

          {/* Right: Property Inspector */}
          {isDesignMode && (
            <TemplateInspector
              template={activeTemplate}
              selectedBlockId={selectedBlockId}
              onUpdateTemplate={updateTemplate}
              onUpdateBlock={handleUpdateBlock}
              onRemoveBlock={handleRemoveBlock}
              onReorderBlock={handleReorderBlock}
              onSelectBlock={(id) => setSelectedBlockId(id)}
              onResetToPresets={() => {
                resetToPresets();
                onShowToast?.('Đã khôi phục tất cả mẫu in về mặc định ban đầu', 'success');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TemplateBuilderModal);
