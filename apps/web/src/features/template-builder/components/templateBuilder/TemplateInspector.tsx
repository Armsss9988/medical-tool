import { memo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Sliders,
  RotateCcw
} from 'lucide-react';
import {
  ReportTemplate,
  TemplateBlock,
  HeaderBlockProps,
  TitleBlockProps,
  PatientInfoBlockProps,
  TestTableBlockProps,
  AllergenSummaryBlockProps,
  AllergenDetailBlockProps,
  AllergenScaleBlockProps,
  AllergenHeaderBlockProps,
  AllergenTitleBlockProps,
  AllergenPatientSummaryBlockProps,
  AllergenPositiveTableBlockProps,
  AllergenScaleTableBlockProps,
  AllergenSymptomsBoxBlockProps,
  AllergenTigeNoteBlockProps,
  AllergenDetailTableBlockProps,
  AllergenPreventionGuideBlockProps,
  AllergenCoverSummaryBlockProps,
  PageBreakBlockProps,
  ConclusionBlockProps,
  SignatureBlockProps,
  CustomTextBlockProps
} from '@domain/templateTypes';

interface TemplateInspectorProps {
  template: ReportTemplate;
  selectedBlockId: string | null;
  onUpdateTemplate: (template: ReportTemplate) => void;
  onUpdateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorderBlock: (blockId: string, direction: 'up' | 'down') => void;
  onSelectBlock?: (blockId: string | null) => void;
  onResetToPresets?: () => void;
}

function TemplateInspector({
  template,
  selectedBlockId,
  onUpdateTemplate,
  onUpdateBlock,
  onRemoveBlock,
  onReorderBlock,
  onSelectBlock,
  onResetToPresets
}: TemplateInspectorProps) {
  const [activeTab, setActiveTab] = useState<'props' | 'layers'>('props');
  const selectedBlock = template.blocks.find((b) => b.id === selectedBlockId);
  const sortedBlocks = [...template.blocks].sort((a, b) => a.order - b.order);

  const handleGlobalChange = <K extends keyof ReportTemplate>(field: K, value: ReportTemplate[K]) => {
    onUpdateTemplate({
      ...template,
      [field]: value
    });
  };

  const handlePropChange = (field: string, value: unknown) => {
    if (!selectedBlock) return;
    onUpdateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        [field]: value
      } as unknown as TemplateBlock['props']
    });
  };

  const handleColumnToggle = (colKey: string, checked: boolean) => {
    if (!selectedBlock || selectedBlock.type !== 'test_table') return;
    const currentCols = (selectedBlock.props as TestTableBlockProps).columns || {};
    handlePropChange('columns', {
      ...currentCols,
      [colKey]: checked
    });
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col h-full overflow-y-auto shrink-0 select-none text-slate-200">
      {/* Tab Header */}
      <div className="flex items-center space-x-1 p-1 bg-slate-800/80 rounded-xl mb-4 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('props')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'props'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Thuộc Tính</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Danh Sách ({sortedBlocks.length})</span>
        </button>
      </div>

      {activeTab === 'layers' ? (
        /* ─── BLOCK LAYERS / OUTLINE LIST ─── */
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Cấu Trúc Các Khối</span>
              <p className="text-[11px] text-slate-400">{sortedBlocks.length} khối theo thứ tự in</p>
            </div>
            {onResetToPresets && (
              <button
                type="button"
                onClick={onResetToPresets}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-amber-400 transition cursor-pointer"
                title="Khôi phục các mẫu về mặc định"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {sortedBlocks.map((block, idx) => {
              const isSelected = block.id === selectedBlockId;
              return (
                <div
                  key={block.id}
                  onClick={() => {
                    onSelectBlock?.(block.id);
                    setActiveTab('props');
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs transition cursor-pointer group ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-500 text-sky-200 ring-1 ring-sky-500/40'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-sky-400 w-4.5 text-right shrink-0">#{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{block.title || block.type}</p>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">{block.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      title={block.visible ? 'Đang hiện khối' : 'Đang ẩn khối'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateBlock(block.id, { visible: !block.visible });
                      }}
                      className={`p-1 rounded transition ${
                        block.visible
                          ? 'text-slate-400 hover:text-sky-400 hover:bg-slate-700'
                          : 'text-amber-400 hover:text-amber-300 bg-amber-950/40'
                      }`}
                    >
                      {block.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      title="Di chuyển lên"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderBlock(block.id, 'up');
                      }}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Di chuyển xuống"
                      disabled={idx === sortedBlocks.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderBlock(block.id, 'down');
                      }}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Xóa khối này"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBlock(block.id);
                      }}
                      className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : selectedBlock ? (
        /* ─── BLOCK INSPECTOR ─── */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Thuộc Tính Khối</span>
              <h4 className="text-sm font-black text-slate-100">{selectedBlock.title || selectedBlock.type}</h4>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => onReorderBlock(selectedBlock.id, 'up')}
                title="Di chuyển lên"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onReorderBlock(selectedBlock.id, 'down')}
                title="Di chuyển xuống"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateBlock(selectedBlock.id, { visible: !selectedBlock.visible })}
                title={selectedBlock.visible ? 'Ẩn khối' : 'Hiện khối'}
                className={`p-1 rounded-lg transition ${
                  selectedBlock.visible
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    : 'bg-amber-900/60 text-amber-300'
                }`}
              >
                {selectedBlock.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => onRemoveBlock(selectedBlock.id)}
                title="Xóa khối"
                className="p-1 rounded-lg bg-red-950/60 hover:bg-red-800 text-red-300 hover:text-white transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Common Block Controls: Visible + Visibility Condition ─── */}
          <div className="bg-slate-800/70 rounded-xl p-3 space-y-3 text-xs border border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Quy Tắc Hiển Thị Khối</span>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300 font-medium">Bật / Tắt hiển thị khối</span>
              <button
                type="button"
                onClick={() => onUpdateBlock(selectedBlock.id, { visible: !selectedBlock.visible })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  selectedBlock.visible ? 'bg-sky-600' : 'bg-slate-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  selectedBlock.visible ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </label>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Điều kiện hiển thị theo dữ liệu:</label>
              <select
                value={selectedBlock.visibilityCondition || (selectedBlock.autoHideWhenEmpty ? 'auto' : 'always')}
                onChange={(e) => {
                  const val = e.target.value as import('@domain/templateTypes').BlockVisibilityCondition;
                  onUpdateBlock(selectedBlock.id, {
                    visibilityCondition: val,
                    autoHideWhenEmpty: val !== 'always' && val !== 'never'
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs font-semibold focus:border-sky-500 outline-none cursor-pointer"
              >
                <option value="always">🟢 Luôn hiển thị (kể cả khi không có data)</option>
                <option value="auto">⚙️ Tự động nhận diện (Ẩn khi dữ liệu rỗng)</option>
                <option value="has_regular_tests">🧪 Chỉ hiện khi có CHỈ SỐ THƯỜNG (Sinh hóa, Huyết học...)</option>
                <option value="has_allergen_tests">🔬 Chỉ hiện khi có CHỈ SỐ DỊ NGUYÊN (Panel IgE)</option>
                <option value="has_positive_allergens">⚠️ Chỉ hiện khi có DỊ NGUYÊN DƯƠNG TÍNH (&gt; Độ 0)</option>
                <option value="has_conclusion">📝 Chỉ hiện khi có LỜI DẶN / KẾT LUẬN bác sĩ</option>
                <option value="never">🚫 Luôn ẩn</option>
              </select>
              <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">
                Hệ thống tự động lọc và ẩn các khối không có dữ liệu thực tế ngoài trang in.
              </p>
            </div>
          </div>

          {/* Tùy chỉnh theo từng loại Block */}
          {selectedBlock.type === 'header' && (() => {
            const p = selectedBlock.props as HeaderBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showLogo !== false}
                    onChange={(e) => handlePropChange('showLogo', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Logo phòng khám</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showClinicName !== false}
                    onChange={(e) => handlePropChange('showClinicName', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Tên phòng khám</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showAddress !== false}
                    onChange={(e) => handlePropChange('showAddress', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Địa chỉ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showContact !== false}
                    onChange={(e) => handlePropChange('showContact', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Website &amp; Hotline</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showQr !== false}
                    onChange={(e) => handlePropChange('showQr', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Mã QR Tra Cứu</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.borderBottom !== false}
                    onChange={(e) => handlePropChange('borderBottom', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Đường kẻ dưới Header (Viền xanh)</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'title' && (() => {
            const p = selectedBlock.props as TitleBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nội dung Tiêu đề:</label>
                  <input
                    type="text"
                    value={p.text || ''}
                    onChange={(e) => handlePropChange('text', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cỡ chữ:</label>
                  <select
                    value={p.fontSize || 'xl'}
                    onChange={(e) => handlePropChange('fontSize', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  >
                    <option value="sm">Nhỏ (14px)</option>
                    <option value="md">Vừa (16px)</option>
                    <option value="lg">Lớn (18px)</option>
                    <option value="xl">Rất lớn (22px)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Căn lề:</label>
                  <select
                    value={p.align || 'center'}
                    onChange={(e) => handlePropChange('align', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  >
                    <option value="left">Căn trái</option>
                    <option value="center">Căn giữa</option>
                    <option value="right">Căn phải</option>
                  </select>
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'patient_info' && (() => {
            const p = selectedBlock.props as PatientInfoBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kiểu bố cục:</label>
                  <select
                    value={p.layout || 'table_12_fields'}
                    onChange={(e) => handlePropChange('layout', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  >
                    <option value="table_12_fields">Bảng 12 trường chuẩn y tế (6 hàng x 4 cột)</option>
                    <option value="grid_2_cols">Lưới 2 cột tinh gọn</option>
                  </select>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.highlightName !== false}
                    onChange={(e) => handlePropChange('highlightName', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Tô màu đỏ in đậm Tên Bệnh Nhân</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.highlightSampleCode !== false}
                    onChange={(e) => handlePropChange('highlightSampleCode', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Tô màu đỏ in đậm Số Bệnh Phẩm</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'test_table' && (() => {
            const p = selectedBlock.props as TestTableBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div className="pb-2 border-b border-slate-800">
                  <label className="text-[11px] font-bold text-sky-400 block mb-1.5">Bật / Tắt Các Cột Dữ Liệu:</label>
                  <div className="space-y-1.5">
                    {[
                      { key: 'stt', label: 'Cột STT' },
                      { key: 'name', label: 'Cột Tên Xét Nghiệm' },
                      { key: 'result', label: 'Cột Kết Quả' },
                      { key: 'refRange', label: 'Cột Trị Số Tham Chiếu' },
                      { key: 'unit', label: 'Cột Đơn Vị' },
                      { key: 'equipment', label: 'Cột Thiết Bị Đo' },
                      { key: 'price', label: 'Cột Giá Tiền' },
                      { key: 'note', label: 'Cột Ghi Chú' }
                    ].map((col) => {
                      const isChecked = !!p.columns?.[col.key as keyof typeof p.columns];
                      return (
                        <label key={col.key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleColumnToggle(col.key, e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800 text-sky-500"
                          />
                          <span>{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.groupByCategory !== false}
                    onChange={(e) => handlePropChange('groupByCategory', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Gom nhóm theo Chuyên Khoa (Huyết học, Sinh hóa...)</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.highlightAbnormal !== false}
                    onChange={(e) => handlePropChange('highlightAbnormal', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Tô màu đỏ đậm chỉ số Vượt Ngưỡng</span>
                </label>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Mật độ dòng (Density):</label>
                  <select
                    value={p.density || 'normal'}
                    onChange={(e) => handlePropChange('density', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  >
                    <option value="compact">Gọn gàng (Compact)</option>
                    <option value="normal">Tiêu chuẩn (Normal)</option>
                    <option value="relaxed">Thoáng (Relaxed)</option>
                  </select>
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'conclusion' && (() => {
            const p = selectedBlock.props as ConclusionBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề khối:</label>
                  <input
                    type="text"
                    value={p.title || ''}
                    onChange={(e) => handlePropChange('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Màu nền:</label>
                  <select
                    value={p.bgColor || 'slate'}
                    onChange={(e) => handlePropChange('bgColor', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  >
                    <option value="slate">Xám nhạt (Slate)</option>
                    <option value="amber">Vàng nhạt (Amber)</option>
                    <option value="white">Trắng</option>
                    <option value="transparent">Trong suốt</option>
                  </select>
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'signature' && (() => {
            const p = selectedBlock.props as SignatureBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Chức danh ký:</label>
                  <input
                    type="text"
                    value={p.title || ''}
                    onChange={(e) => handlePropChange('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showDate !== false}
                    onChange={(e) => handlePropChange('showDate', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Ngày ký (Ngày dd/mm/yyyy)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showStamp !== false}
                    onChange={(e) => handlePropChange('showStamp', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Con Dấu &amp; Chữ Ký Scan</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showDoctorName !== false}
                    onChange={(e) => handlePropChange('showDoctorName', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Tên Bác Sĩ in hoa</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_header' && (() => {
            const p = selectedBlock.props as AllergenHeaderBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showLogo !== false}
                    onChange={(e) => handlePropChange('showLogo', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Logo phòng khám</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showClinicName !== false}
                    onChange={(e) => handlePropChange('showClinicName', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Tên phòng khám</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showAddress !== false}
                    onChange={(e) => handlePropChange('showAddress', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Địa chỉ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showContact !== false}
                    onChange={(e) => handlePropChange('showContact', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Hotline &amp; Website</span>
                </label>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Chữ trên huy hiệu góc phải:</label>
                  <input
                    type="text"
                    value={p.badgeText || ''}
                    onChange={(e) => handlePropChange('badgeText', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:border-sky-500 outline-none"
                  />
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_title' && (() => {
            const p = selectedBlock.props as AllergenTitleBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề chính:</label>
                  <input
                    type="text"
                    value={p.text || ''}
                    onChange={(e) => handlePropChange('text', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phụ đề (màu đỏ):</label>
                  <input
                    type="text"
                    value={p.subtitle || ''}
                    onChange={(e) => handlePropChange('subtitle', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_patient_summary' && (() => {
            const p = selectedBlock.props as AllergenPatientSummaryBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.highlightName !== false}
                    onChange={(e) => handlePropChange('highlightName', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Tô màu đỏ Họ tên Bệnh nhân</span>
                </label>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Loại mẫu xét nghiệm:</label>
                  <input
                    type="text"
                    value={p.sampleType || 'Huyết thanh'}
                    onChange={(e) => handlePropChange('sampleType', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_positive_table' && (() => {
            const p = selectedBlock.props as AllergenPositiveTableBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showScientific !== false}
                    onChange={(e) => handlePropChange('showScientific', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Cột Tên Khoa Học</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showCode !== false}
                    onChange={(e) => handlePropChange('showCode', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Cột Mã Code Dị Nguyên</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showTIgE !== false}
                    onChange={(e) => handlePropChange('showTIgE', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Nồng độ TIgE (nếu có)</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_symptoms_box' && (() => {
            const p = selectedBlock.props as AllergenSymptomsBoxBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề khung cảnh báo:</label>
                  <input
                    type="text"
                    value={p.title || ''}
                    onChange={(e) => handlePropChange('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showSkin !== false}
                    onChange={(e) => handlePropChange('showSkin', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Triệu chứng Da, Niêm Mạc</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showRespiratory !== false}
                    onChange={(e) => handlePropChange('showRespiratory', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Triệu chứng Hô Hấp</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showDigestive !== false}
                    onChange={(e) => handlePropChange('showDigestive', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Triệu chứng Tiêu Hóa</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showSevere !== false}
                    onChange={(e) => handlePropChange('showSevere', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Thần Kinh &amp; Sốc Phản Vệ</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_detail_table' && (() => {
            const p = selectedBlock.props as AllergenDetailTableBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề bảng:</label>
                  <input
                    type="text"
                    value={p.title || ''}
                    onChange={(e) => handlePropChange('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.highlightPositive !== false}
                    onChange={(e) => handlePropChange('highlightPositive', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Tô màu nổi bật dị nguyên dương tính</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_scale_table' && (() => {
            const p = selectedBlock.props as AllergenScaleTableBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề bảng thang đo:</label>
                  <input
                    type="text"
                    value={p.title || 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH'}
                    onChange={(e) => handlePropChange('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showBadges !== false}
                    onChange={(e) => handlePropChange('showBadges', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Huy hiệu SVG Độ (+)</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_tige_note' && (() => {
            const p = selectedBlock.props as AllergenTigeNoteBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề ghi chú:</label>
                  <input
                    type="text"
                    value={p.title || 'Ghi chú: Tổng nồng độ IgE (TIgE)'}
                    onChange={(e) => handlePropChange('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Khoảng bình thường:</label>
                  <input
                    type="text"
                    value={p.normalRange || '<15,0'}
                    onChange={(e) => handlePropChange('normalRange', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_prevention_guide' && (() => {
            const p = selectedBlock.props as AllergenPreventionGuideBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề hướng dẫn:</label>
                  <input
                    type="text"
                    value={p.title || 'MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG'}
                    onChange={(e) => handlePropChange('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_cover_summary' && (() => {
            const p = selectedBlock.props as AllergenCoverSummaryBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề khung tóm tắt:</label>
                  <input
                    type="text"
                    value={p.boxTitle || 'TỔNG QUAN GÓI TẦM SOÁT DỊ NGUYÊN'}
                    onChange={(e) => handlePropChange('boxTitle', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showPackageName !== false}
                    onChange={(e) => handlePropChange('showPackageName', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Tên Gói Dị Nguyên</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showItemCount !== false}
                    onChange={(e) => handlePropChange('showItemCount', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Số lượng Dị nguyên</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showPackagePrice !== false}
                    onChange={(e) => handlePropChange('showPackagePrice', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Giá Gói (đ)</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_summary' && (() => {
            const p = selectedBlock.props as AllergenSummaryBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tiêu đề:</label>
                  <input
                    type="text"
                    value={p.title || 'TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH'}
                    onChange={(e) => handlePropChange('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showNegativeNotice !== false}
                    onChange={(e) => handlePropChange('showNegativeNotice', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị thông báo khi tất cả âm tính</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_detail' && (() => {
            const p = selectedBlock.props as AllergenDetailBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showGradeBadge !== false}
                    onChange={(e) => handlePropChange('showGradeBadge', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị Huy hiệu Độ (+)</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'allergen_scale' && (() => {
            const p = selectedBlock.props as AllergenScaleBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.showGuidelines !== false}
                    onChange={(e) => handlePropChange('showGuidelines', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500"
                  />
                  <span>Hiển thị hướng dẫn phòng ngừa</span>
                </label>
              </div>
            );
          })()}

          {selectedBlock.type === 'page_break' && (() => {
            const p = selectedBlock.props as PageBreakBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ghi chú tên trang mới:</label>
                  <input
                    type="text"
                    value={p.label || ''}
                    onChange={(e) => handlePropChange('label', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>
            );
          })()}

          {selectedBlock.type === 'custom_text' && (() => {
            const p = selectedBlock.props as CustomTextBlockProps;
            return (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nội dung văn bản:</label>
                  <textarea
                    rows={4}
                    value={p.content || ''}
                    onChange={(e) => handlePropChange('content', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* ─── GLOBAL TEMPLATE SETTINGS ─── */
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Cài Đặt Mẫu In</span>
            <h4 className="text-sm font-black text-slate-100">{template.name}</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tên Mẫu Phiếu:</label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => handleGlobalChange('name', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Phông Chữ (Font Family):</label>
              <select
                value={template.fontFamily}
                onChange={(e) => handleGlobalChange('fontFamily', e.target.value as ReportTemplate['fontFamily'])}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
              >
                <option value="Times New Roman">Times New Roman (Chuẩn Y Tế)</option>
                <option value="Arial">Arial (Hiện Đại Không Chân)</option>
                <option value="Roboto">Roboto (Chuẩn Web)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Khổ Giấy:</label>
              <select
                value={template.paperSize}
                onChange={(e) => handleGlobalChange('paperSize', e.target.value as ReportTemplate['paperSize'])}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
              >
                <option value="A4">A4 (210mm × 297mm)</option>
                <option value="A5">A5 (148mm × 210mm)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Lề Trang (Padding mm):</label>
              <input
                type="number"
                min={5}
                max={30}
                value={template.paddingMm || 15}
                onChange={(e) => handleGlobalChange('paddingMm', parseInt(e.target.value) || 15)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs outline-none"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={template.isDefault}
                  onChange={(e) => handleGlobalChange('isDefault', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-sky-500"
                />
                <span className="font-semibold text-sky-400">Đặt làm Mẫu Mặc Định Khi In</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(TemplateInspector);
