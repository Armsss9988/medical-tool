import { memo } from "react";
import {
  Building2,
  Heading,
  User,
  Table,
  Sparkles,
  FileCheck2,
  ListOrdered,
  PenTool,
  Type,
  Minus,
  MoveVertical,
  Plus,
  ShieldAlert,
  UserCheck,
  BarChart3,
  AlertTriangle,
  Info,
  BookOpen,
  PackageSearch,
  Scissors,
  GripVertical
} from "lucide-react";
import { TemplateBlock, TemplateBlockType } from "@domain/templateTypes";

interface PaletteItem {
  type: TemplateBlockType;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "core" | "allergen" | "formatting";
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: "header", title: "Header Phòng Khám", desc: "Logo, Tên đơn vị, Địa chỉ, Hotline, QR Tra cứu", icon: Building2, category: "core" },
  { type: "title", title: "Tiêu Đề Phiếu", desc: "Tên phiếu xét nghiệm, cỡ chữ, căn lề", icon: Heading, category: "core" },
  { type: "patient_info", title: "Thông Tin Bệnh Nhân", desc: "Bảng 12 trường 6x4, hoặc dạng lưới 2 cột", icon: User, category: "core" },
  { type: "test_table", title: "Bảng Chỉ Số Xét Nghiệm", desc: "Bảng chỉ số tùy biến bật/tắt 8 cột & phân nhóm", icon: Table, category: "core" },
  { type: "conclusion", title: "Kết Luận & Lời Dặn", desc: "Lời dặn y khoa của bác sĩ", icon: FileCheck2, category: "core" },
  { type: "signature", title: "Chữ Ký & Con Dấu", desc: "Ngày ký, chức danh, con dấu và bác sĩ phụ trách", icon: PenTool, category: "core" },
  { type: "allergen_header", title: "Header Báo Cáo Dị Nguyên", desc: 'Logo, thông tin và huy hiệu đỏ "BÁO CÁO DỊ NGUYÊN"', icon: ShieldAlert, category: "allergen" },
  { type: "allergen_title", title: "Tiêu Đề Định Lượng IgE", desc: "KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU", icon: Heading, category: "allergen" },
  { type: "allergen_patient_summary", title: "Thanh BN Tóm Tắt Ngang", desc: "Họ tên, Năm sinh, Giới tính, Mẫu huyết thanh", icon: UserCheck, category: "allergen" },
  { type: "allergen_positive_table", title: "Bảng Dị Nguyên Dương Tính", desc: "Bảng 5 cột: STT, Dị nguyên, Tên KH, Mã, Độ (+)", icon: Sparkles, category: "allergen" },
  { type: "allergen_scale_table", title: "Bảng Diễn Giải Thang Đo (+)", desc: "Thang đo Độ 0->6, nồng độ IU/ml và diễn giải mức độ", icon: BarChart3, category: "allergen" },
  { type: "allergen_symptoms_box", title: "Khung Triệu Chứng Dị Ứng", desc: "Cảnh báo Da, Hô hấp, Tiêu hóa, Thần kinh & Sốc", icon: AlertTriangle, category: "allergen" },
  { type: "allergen_tige_note", title: "Ghi Chú Nồng Độ TIgE", desc: "Bảng ghi chú giá trị chuẩn IgE toàn phần <15.0", icon: Info, category: "allergen" },
  { type: "allergen_detail_table", title: "Bảng Chi Tiết {N} Dị Nguyên", desc: "Bảng 9 cột: Toàn bộ danh mục dị nguyên, IU/ml, Độ (+)", icon: ListOrdered, category: "allergen" },
  { type: "allergen_prevention_guide", title: "5 Lưu Ý Phòng Ngừa Dị Ứng", desc: "Hướng dẫn phòng ngừa dị ứng & phản ứng chéo y khoa", icon: BookOpen, category: "allergen" },
  { type: "allergen_cover_summary", title: "Tóm Tắt Gói Trên Trang Bìa", desc: "Tên gói dị nguyên, số lượng chỉ số, giá tiền", icon: PackageSearch, category: "allergen" },
  { type: "page_break", title: "Ngắt Trang In A4", desc: "Đẩy các khối phía sau sang Trang in mới", icon: Scissors, category: "formatting" },
  { type: "custom_text", title: "Văn Bản Tự Do", desc: "Ghi chú thêm, lưu ý, thông báo", icon: Type, category: "formatting" },
  { type: "divider", title: "Đường Phân Cách", desc: "Đường kẻ nét liền/đứt ngăn cách", icon: Minus, category: "formatting" },
  { type: "spacer", title: "Khoảng Trống Đệm", desc: "Khoảng cách trống giữa các khối", icon: MoveVertical, category: "formatting" }
];

interface TemplatePaletteProps {
  onAddBlock: (type: TemplateBlockType) => void;
  existingBlocks?: TemplateBlock[];
}

function TemplatePalette({ onAddBlock, existingBlocks = [] }: TemplatePaletteProps) {
  const getCount = (type: TemplateBlockType) => existingBlocks.filter((b) => b.type === type).length;

  const handleDragStart = (e: React.DragEvent, type: TemplateBlockType) => {
    e.dataTransfer.setData("block_type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const renderItem = (item: PaletteItem, accentClass: string) => {
    const Icon = item.icon;
    const count = getCount(item.type);
    return (
      <div
        key={item.type}
        draggable
        onDragStart={(e) => handleDragStart(e, item.type)}
        className={`group w-full flex items-start space-x-2 p-2 rounded-xl ${accentClass} border border-slate-700/80 text-left transition-all active:scale-[0.98] cursor-grab active:cursor-grabbing`}
      >
        <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0 mt-1 transition-colors" />
        <div className="p-1 rounded-lg bg-slate-700/50 text-slate-400 shrink-0">
          <Icon className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => onAddBlock(item.type)}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300 truncate">{item.title}</span>
            {count > 0 ? (
              <span className="text-[9px] font-mono font-bold px-1.5 bg-sky-950 border border-sky-600 text-sky-400 rounded-full shrink-0 ml-1">x{count}</span>
            ) : (
              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">{item.desc}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 p-3 flex flex-col h-full overflow-y-auto shrink-0 select-none">
      <div className="mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
          <span>📦</span>
          <span>Khối Y Khoa</span>
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
          <GripVertical className="w-3 h-3 shrink-0" />
          <span>Kéo thả hoặc bấm để thêm</span>
        </p>
      </div>
      <div className="space-y-1.5 mb-4">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 block">Khối Cơ Bản</span>
        {PALETTE_ITEMS.filter((i) => i.category === "core").map((item) => renderItem(item, "bg-slate-800/80 hover:bg-sky-950/60 hover:border-sky-500/60"))}
      </div>
      <div className="space-y-1.5 mb-4">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 block">Khối Dị Nguyên</span>
        {PALETTE_ITEMS.filter((i) => i.category === "allergen").map((item) => renderItem(item, "bg-slate-800/80 hover:bg-purple-950/60 hover:border-purple-500/60"))}
      </div>
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 block">Định Dạng &amp; Bổ Trợ</span>
        {PALETTE_ITEMS.filter((i) => i.category === "formatting").map((item) => renderItem(item, "bg-slate-800/80 hover:bg-slate-700 hover:border-slate-500"))}
      </div>
    </div>
  );
}

export default memo(TemplatePalette);
