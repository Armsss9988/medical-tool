export type TemplateBlockType =
  | 'header'
  | 'title'
  | 'patient_info'
  | 'test_table'
  | 'allergen_summary'
  | 'allergen_detail'
  | 'allergen_scale'
  | 'allergen_header'
  | 'allergen_title'
  | 'allergen_patient_summary'
  | 'allergen_positive_table'
  | 'allergen_scale_table'
  | 'allergen_symptoms_box'
  | 'allergen_tige_note'
  | 'allergen_detail_table'
  | 'allergen_prevention_guide'
  | 'allergen_cover_summary'
  | 'page_break'
  | 'conclusion'
  | 'signature'
  | 'custom_text'
  | 'divider'
  | 'spacer';

export interface HeaderBlockProps {
  showLogo: boolean;
  showClinicName: boolean;
  showAddress: boolean;
  showContact: boolean;
  showQr: boolean;
  clinicNameSize?: 'sm' | 'md' | 'lg';
  borderBottom?: boolean;
}

export interface TitleBlockProps {
  text: string;
  subtitle?: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  uppercase?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface PatientInfoBlockProps {
  layout: 'table_12_fields' | 'grid_2_cols' | 'grid_3_cols' | 'compact';
  highlightName: boolean;
  highlightSampleCode: boolean;
  showSampleStatus: boolean;
  showDoctor: boolean;
  showReceivedAt: boolean;
  showReturnedAt: boolean;
}

export interface TestTableBlockProps {
  columns: {
    stt: boolean;
    name: boolean;
    result: boolean;
    refRange: boolean;
    unit: boolean;
    equipment: boolean;
    price: boolean;
    note: boolean;
  };
  groupByCategory: boolean;
  highlightAbnormal: boolean;
  fontSize?: 'xs' | 'sm' | 'md';
  density?: 'compact' | 'normal' | 'relaxed';
}

export interface AllergenSummaryBlockProps {
  title?: string;
  showScaleBadges: boolean;
  showRoute: boolean;
  showConcentration: boolean;
  showNegativeNotice: boolean;
}

export interface AllergenDetailBlockProps {
  itemsPerPage: number;
  showNormalRef: boolean;
  showGradeBadge: boolean;
}

export interface AllergenScaleBlockProps {
  showGuidelines: boolean;
}

// ─── CHUYÊN BIỆT DỊ NGUYÊN ───────────────────────────────────────────────────

export interface AllergenHeaderBlockProps {
  showLogo: boolean;
  showClinicName: boolean;
  showAddress: boolean;
  showContact: boolean;
  badgeText: string;
  badgeColor?: string;
}

export interface AllergenTitleBlockProps {
  text: string;
  subtitle?: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  subtitleColor?: string;
  align?: 'left' | 'center' | 'right';
}

export interface AllergenPatientSummaryBlockProps {
  showName: boolean;
  showDob: boolean;
  showGender: boolean;
  sampleType: string;
  highlightName: boolean;
}

export interface AllergenPositiveTableBlockProps {
  title?: string;
  showScientific: boolean;
  showCode: boolean;
  showGradeBadge: boolean;
  showTIgE: boolean;
  emptyNotice?: string;
  footnote?: string;
}

export interface AllergenScaleTableBlockProps {
  title: string;
  showBadges: boolean;
  showConcentration: boolean;
  showInterpretation: boolean;
}

export interface AllergenSymptomsBoxBlockProps {
  title: string;
  showSkin: boolean;
  showRespiratory: boolean;
  showDigestive: boolean;
  showSevere: boolean;
  warningText?: string;
}

export interface AllergenTigeNoteBlockProps {
  title: string;
  normalRange: string;
  interpretation: string;
}

export interface AllergenDetailTableBlockProps {
  title?: string;
  itemsPerPage?: number;
  columns: {
    tt: boolean;
    code: boolean;
    name: boolean;
    allergenName: boolean;
    route: boolean;
    normalRef: boolean;
    result: boolean;
    grade: boolean;
    note: boolean;
  };
  highlightPositive: boolean;
}

export interface AllergenPreventionGuideBlockProps {
  title: string;
  showItems: {
    item1: boolean;
    item2: boolean;
    item3: boolean;
    item4: boolean;
    item5: boolean;
  };
}

export interface AllergenCoverSummaryBlockProps {
  showPackageName: boolean;
  showItemCount: boolean;
  showPackagePrice: boolean;
  boxTitle?: string;
}

export interface PageBreakBlockProps {
  label?: string;
}

export interface ConclusionBlockProps {
  title: string;
  showBorder: boolean;
  bgColor?: 'white' | 'slate' | 'amber' | 'transparent';
  fontSize?: 'xs' | 'sm' | 'md';
}

export interface SignatureBlockProps {
  showDate: boolean;
  title: string;
  showStamp: boolean;
  showDoctorName: boolean;
  align?: 'right' | 'between';
}

export interface CustomTextBlockProps {
  content: string;
  fontSize?: 'xs' | 'sm' | 'md';
  fontStyle?: 'normal' | 'italic' | 'bold';
  align?: 'left' | 'center' | 'right';
  textColor?: string;
}

export interface DividerBlockProps {
  thickness: number; // in px
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  color?: string;
  marginVertical: number; // in px
}

export interface SpacerBlockProps {
  height: number; // in px
}

export type TemplateBlockPropsMap = {
  header: HeaderBlockProps;
  title: TitleBlockProps;
  patient_info: PatientInfoBlockProps;
  test_table: TestTableBlockProps;
  allergen_summary: AllergenSummaryBlockProps;
  allergen_detail: AllergenDetailBlockProps;
  allergen_scale: AllergenScaleBlockProps;
  allergen_header: AllergenHeaderBlockProps;
  allergen_title: AllergenTitleBlockProps;
  allergen_patient_summary: AllergenPatientSummaryBlockProps;
  allergen_positive_table: AllergenPositiveTableBlockProps;
  allergen_scale_table: AllergenScaleTableBlockProps;
  allergen_symptoms_box: AllergenSymptomsBoxBlockProps;
  allergen_tige_note: AllergenTigeNoteBlockProps;
  allergen_detail_table: AllergenDetailTableBlockProps;
  allergen_prevention_guide: AllergenPreventionGuideBlockProps;
  allergen_cover_summary: AllergenCoverSummaryBlockProps;
  page_break: PageBreakBlockProps;
  conclusion: ConclusionBlockProps;
  signature: SignatureBlockProps;
  custom_text: CustomTextBlockProps;
  divider: DividerBlockProps;
  spacer: SpacerBlockProps;
};

export type BlockVisibilityCondition =
  | 'always'
  | 'auto'
  | 'has_regular_tests'
  | 'has_allergen_tests'
  | 'has_positive_allergens'
  | 'has_conclusion'
  | 'never';

export interface TemplateBlock<T extends TemplateBlockType = TemplateBlockType> {
  id: string;
  type: T;
  title?: string;
  visible: boolean;
  /** Điều kiện dữ liệu để hiển thị khối ('always' | 'auto' | 'has_regular_tests' | 'has_allergen_tests' | 'has_positive_allergens' | 'has_conclusion' | 'never') */
  visibilityCondition?: BlockVisibilityCondition;
  /** Nếu true và không có dữ liệu thực tế, block tự ẩn ngoài design mode */
  autoHideWhenEmpty?: boolean;
  order: number;
  props: TemplateBlockPropsMap[T];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'clinical' | 'allergen' | 'hybrid' | 'general' | 'custom';
  isDefault: boolean;
  paperSize: 'A4' | 'A5';
  orientation: 'portrait' | 'landscape';
  fontFamily: 'Times New Roman' | 'Arial' | 'Roboto' | 'Inter';
  primaryColor: string; // e.g. '#0284c7'
  paddingMm: number; // e.g. 15 (mm)
  createdAt: string;
  updatedAt: string;
  blocks: TemplateBlock[];
}

// ─── 4 PRESET TEMPLATES ──────────────────────────────────────────────────────

export const PRESET_TEMPLATES: ReportTemplate[] = [
  // 1. MẪU XÉT NGHIỆM KẾT HỢP SINH HÓA & DỊ NGUYÊN (TIÊU CHUẨN GOLAB)
  {
    id: 'tpl_standard_clinical',
    name: 'Mẫu Kết Hợp Sinh Hóa & Dị Nguyên Chuẩn (Tiêu chuẩn GoLab)',
    description: 'Trang 1: Bảng 12 trường, Bảng chỉ số thường, Bảng tổng hợp dị nguyên dương tính & Chữ ký; Trang 2: Hướng dẫn phòng ngừa dị ứng; Trang 3+: Bảng chi tiết nồng độ IU/ml & Thang đo.',
    category: 'hybrid',
    isDefault: true,
    paperSize: 'A4',
    orientation: 'portrait',
    fontFamily: 'Times New Roman',
    primaryColor: '#0284c7',
    paddingMm: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      // ─── TRANG 1: KHÁM & KẾT QUẢ TỔNG HỢP (ẢNH 1, 4, 3, 2) ───
      {
        id: 'block_header_1',
        type: 'header',
        title: 'Trang 1: Header Phòng Khám & QR',
        visible: true,
        order: 1,
        props: {
          showLogo: true,
          showClinicName: true,
          showAddress: true,
          showContact: true,
          showQr: true,
          clinicNameSize: 'md',
          borderBottom: true
        }
      },
      {
        id: 'block_title_1',
        type: 'title',
        title: 'Trang 1: Tiêu Đề Phiếu',
        visible: true,
        order: 2,
        props: {
          text: 'PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM',
          fontSize: 'xl',
          textColor: '#0f172a',
          uppercase: true,
          align: 'center'
        }
      },
      {
        id: 'block_patient_1',
        type: 'patient_info',
        title: 'Trang 1: Thông Tin Bệnh Nhân (12 Trường)',
        visible: true,
        order: 3,
        props: {
          layout: 'table_12_fields',
          highlightName: true,
          highlightSampleCode: true,
          showSampleStatus: true,
          showDoctor: true,
          showReceivedAt: true,
          showReturnedAt: true
        }
      },
      {
        id: 'block_table_1',
        type: 'test_table',
        title: 'Trang 1: Bảng Chỉ Số Xét Nghiệm Thường',
        visible: true,
        order: 4,
        props: {
          columns: {
            stt: true,
            name: true,
            result: true,
            refRange: true,
            unit: true,
            equipment: true,
            price: false,
            note: true
          },
          groupByCategory: true,
          highlightAbnormal: true,
          fontSize: 'sm',
          density: 'normal'
        }
      },
      {
        id: 'block_allergen_patient_summary_1',
        type: 'allergen_patient_summary',
        title: 'Trang 1: Thanh Bệnh Nhân Tóm Tắt Dị Nguyên',
        visible: true,
        order: 5,
        props: {
          showName: true,
          showDob: true,
          showGender: true,
          sampleType: 'Huyết thanh',
          highlightName: true
        }
      },
      {
        id: 'block_allergen_positive_table_1',
        type: 'allergen_positive_table',
        title: 'Trang 1: Bảng Dị Nguyên Dương Tính Tóm Tắt',
        visible: true,
        order: 6,
        props: {
          title: 'TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH',
          showScientific: true,
          showCode: true,
          showGradeBadge: true,
          showTIgE: true,
          emptyNotice: 'Chưa phát hiện dị nguyên dương tính',
          footnote: '(Chi tiết vui lòng xem trang sau)'
        }
      },
      {
        id: 'block_signature_1',
        type: 'signature',
        title: 'Trang 1: Chữ Ký Phụ Trách Chuyên Môn',
        visible: true,
        order: 7,
        props: {
          showDate: true,
          title: 'PHỤ TRÁCH CHUYÊN MÔN',
          showStamp: true,
          showDoctorName: true,
          align: 'right'
        }
      },

      // ─── TRANG 2: HƯỚNG DẪN PHÒNG NGỪA DỊ ỨNG (ẢNH 5) ───
      {
        id: 'block_pagebreak_guide',
        type: 'page_break',
        title: '--- Ngắt sang Trang 2 (Hướng Dẫn Phòng Ngừa Dị Ứng) ---',
        visible: true,
        order: 8,
        props: {
          label: 'Trang 2: Một Số Lưu Ý Về Phòng Ngừa Dị Ứng'
        }
      },
      {
        id: 'block_allergen_guide_1',
        type: 'allergen_prevention_guide',
        title: 'Trang 2: Hướng Dẫn Phòng Ngừa Dị Ứng Chuẩn Y Khoa',
        visible: true,
        order: 9,
        props: {
          title: 'MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG',
          showItems: {
            item1: true,
            item2: true,
            item3: true,
            item4: true,
            item5: true
          }
        }
      },

      // ─── TRANG 3: BẢNG CHI TIẾT DỊ NGUYÊN & THANG ĐO ───
      {
        id: 'block_pagebreak_detail',
        type: 'page_break',
        title: '--- Ngắt sang Trang 3 (Bảng Chi Tiết Dị Nguyên) ---',
        visible: true,
        order: 10,
        props: {
          label: 'Trang 3: Chi Tiết Kết Quả Xét Nghiệm Dị Nguyên'
        }
      },
      {
        id: 'block_allergen_header_p3',
        type: 'allergen_header',
        title: 'Trang 3: Header Báo Cáo Dị Nguyên',
        visible: true,
        order: 11,
        props: {
          showLogo: true,
          showClinicName: true,
          showAddress: true,
          showContact: true,
          badgeText: 'BÁO CÁO DỊ NGUYÊN',
          badgeColor: '#dc2626'
        }
      },
      {
        id: 'block_allergen_title_p3',
        type: 'allergen_title',
        title: 'Trang 3: Tiêu Đề Định Lượng IgE',
        visible: true,
        order: 12,
        props: {
          text: 'KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU',
          subtitle: '(Tổng hợp các dị nguyên định lượng & phân cấp phản ứng)',
          fontSize: 'lg',
          textColor: '#0f172a',
          subtitleColor: '#b91c1c',
          align: 'center'
        }
      },
      {
        id: 'block_allergen_detail_table_p3',
        type: 'allergen_detail_table',
        title: 'Trang 3: Bảng Chi Tiết Toàn Bộ Dị Nguyên (IU/ml)',
        visible: true,
        order: 13,
        props: {
          title: 'CHI TIẾT KẾT QUẢ XÉT NGHIỆM DỊ NGUYÊN',
          itemsPerPage: 13,
          columns: {
            tt: true,
            code: true,
            name: true,
            allergenName: true,
            route: true,
            normalRef: true,
            result: true,
            grade: true,
            note: true
          },
          highlightPositive: true
        }
      },
      {
        id: 'block_allergen_scale_table_p3',
        type: 'allergen_scale_table',
        title: 'Trang 3: Bảng Diễn Giải Thang Đo (+)',
        visible: true,
        order: 14,
        props: {
          title: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH',
          showBadges: true,
          showConcentration: true,
          showInterpretation: true
        }
      },
      {
        id: 'block_allergen_symptoms_p3',
        type: 'allergen_symptoms_box',
        title: 'Trang 3: Khung Triệu Chứng Dị Ứng Thường Gặp',
        visible: true,
        order: 15,
        props: {
          title: 'MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG',
          showSkin: true,
          showRespiratory: true,
          showDigestive: true,
          showSevere: true,
          warningText: 'Nếu xuất hiện các triệu chứng trên sau tiếp xúc cần tư vấn bác sỹ ngay.'
        }
      },
      {
        id: 'block_allergen_tige_p3',
        type: 'allergen_tige_note',
        title: 'Trang 3: Ghi Chú Nồng Độ IgE Toàn Phần (TIgE)',
        visible: true,
        order: 16,
        props: {
          title: 'Ghi chú: Tổng nồng độ IgE (TIgE)',
          normalRange: '<15,0',
          interpretation: 'Mức bình thường — Không tính Độ (+), chỉ có Kết Quả (IU/ml)'
        }
      }
    ]
  },

  // 2. MẪU DỊ NGUYÊN CHUYÊN SÂU (BOOKLET ĐẦY ĐỦ 4 TRANG)
  {
    id: 'tpl_allergen_specialized',
    name: 'Mẫu Báo Cáo Dị Nguyên Chuyên Sâu (IgE Panel Booklet)',
    description: 'Bao gồm Bìa xét nghiệm (Trang 1), Bảng tổng hợp dị nguyên dương tính & Thang đo (Trang 2), Bảng chi tiết nồng độ IU/ml (Trang 3) và Hướng dẫn phòng ngừa dị ứng (Trang 4).',
    category: 'allergen',
    isDefault: false,
    paperSize: 'A4',
    orientation: 'portrait',
    fontFamily: 'Times New Roman',
    primaryColor: '#0284c7',
    paddingMm: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      // ─── TRANG 1: TRANG BÌA XÉT NGHIỆM ───
      {
        id: 'block_header_cover',
        type: 'header',
        title: 'Trang 1: Header Phòng Khám',
        visible: true,
        order: 1,
        props: {
          showLogo: true,
          showClinicName: true,
          showAddress: true,
          showContact: true,
          showQr: true,
          clinicNameSize: 'md',
          borderBottom: true
        }
      },
      {
        id: 'block_title_cover',
        type: 'title',
        title: 'Trang 1: Tiêu Đề Phiếu',
        visible: true,
        order: 2,
        props: {
          text: 'PHIẾU KẾT QUẢ XÉT NGHIỆM',
          fontSize: 'xl',
          textColor: '#0f172a',
          uppercase: true,
          align: 'center'
        }
      },
      {
        id: 'block_patient_cover',
        type: 'patient_info',
        title: 'Trang 1: Thông Tin Bệnh Nhân (12 Trường)',
        visible: true,
        order: 3,
        props: {
          layout: 'table_12_fields',
          highlightName: true,
          highlightSampleCode: true,
          showSampleStatus: true,
          showDoctor: true,
          showReceivedAt: true,
          showReturnedAt: true
        }
      },
      {
        id: 'block_test_table_cover',
        type: 'test_table',
        title: 'Trang 1: Bảng Chỉ Số Xét Nghiệm Thường',
        visible: true,
        order: 4,
        props: {
          columns: {
            stt: true,
            name: true,
            result: true,
            refRange: true,
            unit: true,
            equipment: true,
            price: false,
            note: false
          },
          groupByCategory: true,
          highlightAbnormal: true,
          fontSize: 'sm',
          density: 'normal'
        }
      },
      {
        id: 'block_conclusion_cover',
        type: 'conclusion',
        title: 'Trang 1: Kết Luận & Lời Dặn Bác Sĩ',
        visible: true,
        order: 5,
        props: {
          title: 'KẾT LUẬN & LỜI DẶN:',
          showBorder: true,
          bgColor: 'slate',
          fontSize: 'sm'
        }
      },
      {
        id: 'block_signature_cover',
        type: 'signature',
        title: 'Trang 1: Chữ Ký & Con Dấu',
        visible: true,
        order: 6,
        props: {
          showDate: true,
          title: 'PHỤ TRÁCH CHUYÊN MÔN',
          showStamp: true,
          showDoctorName: true,
          align: 'right'
        }
      },

      // ─── TRANG 2: TỔNG HỢP DỊ NGUYÊN & THANG ĐO ───
      {
        id: 'block_pagebreak_p2',
        type: 'page_break',
        title: '--- Ngắt sang Trang 2 (Tổng Hợp Dị Nguyên) ---',
        visible: true,
        order: 7,
        props: {
          label: 'Trang 2: Định Lượng Kháng Thể IgE Đặc Hiệu'
        }
      },
      {
        id: 'block_allergen_header_p2',
        type: 'allergen_header',
        title: 'Trang 2: Header Báo Cáo Dị Nguyên',
        visible: true,
        order: 8,
        props: {
          showLogo: true,
          showClinicName: true,
          showAddress: true,
          showContact: true,
          badgeText: 'BÁO CÁO DỊ NGUYÊN',
          badgeColor: '#dc2626'
        }
      },
      {
        id: 'block_allergen_title_p2',
        type: 'allergen_title',
        title: 'Trang 2: Tiêu Đề Định Lượng IgE',
        visible: true,
        order: 9,
        props: {
          text: 'KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU',
          subtitle: '(Tổng hợp các dị nguyên dương tính & nồng độ IgE toàn phần)',
          fontSize: 'lg',
          textColor: '#0f172a',
          subtitleColor: '#b91c1c',
          align: 'center'
        }
      },
      {
        id: 'block_allergen_patient_p2',
        type: 'allergen_patient_summary',
        title: 'Trang 2: Thanh Bệnh Nhân Tóm Tắt',
        visible: true,
        order: 10,
        props: {
          showName: true,
          showDob: true,
          showGender: true,
          sampleType: 'Huyết thanh',
          highlightName: true
        }
      },
      {
        id: 'block_allergen_pos_table_p2',
        type: 'allergen_positive_table',
        title: 'Trang 2: Bảng Dị Nguyên Dương Tính (Độ 1-6)',
        visible: true,
        order: 11,
        props: {
          title: 'TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH',
          showScientific: true,
          showCode: true,
          showGradeBadge: true,
          showTIgE: true,
          emptyNotice: 'Chưa phát hiện dị nguyên dương tính',
          footnote: '(Chi tiết vui lòng xem trang sau)'
        }
      },
      {
        id: 'block_allergen_scale_table_p2',
        type: 'allergen_scale_table',
        title: 'Trang 2: Bảng Diễn Giải Thang Đo (+)',
        visible: true,
        order: 12,
        props: {
          title: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH',
          showBadges: true,
          showConcentration: true,
          showInterpretation: true
        }
      },
      {
        id: 'block_allergen_symptoms_p2',
        type: 'allergen_symptoms_box',
        title: 'Trang 2: Khung Triệu Chứng Dị Ứng Thường Gặp',
        visible: true,
        order: 13,
        props: {
          title: 'MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG',
          showSkin: true,
          showRespiratory: true,
          showDigestive: true,
          showSevere: true,
          warningText: 'Nếu xuất hiện các triệu chứng trên sau tiếp xúc cần tư vấn bác sỹ ngay.'
        }
      },
      {
        id: 'block_allergen_tige_p2',
        type: 'allergen_tige_note',
        title: 'Trang 2: Ghi Chú Nồng Độ IgE Toàn Phần (TIgE)',
        visible: true,
        order: 14,
        props: {
          title: 'Ghi chú: Tổng nồng độ IgE (TIgE)',
          normalRange: '<15,0',
          interpretation: 'Mức bình thường — Không tính Độ (+), chỉ có Kết Quả (IU/ml)'
        }
      },

      // ─── TRANG 3: BẢNG CHI TIẾT DỊ NGUYÊN ───
      {
        id: 'block_pagebreak_p3',
        type: 'page_break',
        title: '--- Ngắt sang Trang 3 (Bảng Chi Tiết Dị Nguyên) ---',
        visible: true,
        order: 15,
        props: {
          label: 'Trang 3: Chi Tiết Kết Quả Xét Nghiệm Dị Nguyên'
        }
      },
      {
        id: 'block_allergen_detail_table_p3',
        type: 'allergen_detail_table',
        title: 'Trang 3: Bảng Chi Tiết Toàn Bộ Dị Nguyên (IU/ml)',
        visible: true,
        order: 16,
        props: {
          title: 'CHI TIẾT KẾT QUẢ XÉT NGHIỆM DỊ NGUYÊN',
          itemsPerPage: 13,
          columns: {
            tt: true,
            code: true,
            name: true,
            allergenName: true,
            route: true,
            normalRef: true,
            result: true,
            grade: true,
            note: true
          },
          highlightPositive: true
        }
      },

      // ─── TRANG 4: HƯỚNG DẪN PHÒNG NGỪA DỊ ỨNG ───
      {
        id: 'block_pagebreak_p4',
        type: 'page_break',
        title: '--- Ngắt sang Trang 4 (Hướng Dẫn Phòng Ngừa) ---',
        visible: true,
        order: 17,
        props: {
          label: 'Trang 4: Một Số Lưu Ý Về Phòng Ngừa Dị Ứng'
        }
      },
      {
        id: 'block_allergen_guide_p4',
        type: 'allergen_prevention_guide',
        title: 'Trang 4: Hướng Dẫn Phòng Ngừa Dị Ứng Chuẩn Y Khoa',
        visible: true,
        order: 18,
        props: {
          title: 'MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG',
          showItems: {
            item1: true,
            item2: true,
            item3: true,
            item4: true,
            item5: true
          }
        }
      }
    ]
  },

  // 3. MẪU XÉT NGHIỆM GỌN (COMPACT LAB)
  {
    id: 'tpl_compact_lab',
    name: 'Mẫu Phiếu Sinh Hóa - Huyết Học Gọn (Tiết kiệm diện tích)',
    description: 'Bố cục tinh gọn, mật độ dòng cao, bảng bệnh nhân 2 cột cho các phòng khám vừa và nhỏ.',
    category: 'clinical',
    isDefault: false,
    paperSize: 'A4',
    orientation: 'portrait',
    fontFamily: 'Arial',
    primaryColor: '#0f766e',
    paddingMm: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'block_header_3',
        type: 'header',
        title: 'Header Gọn',
        visible: true,
        order: 1,
        props: {
          showLogo: true,
          showClinicName: true,
          showAddress: true,
          showContact: true,
          showQr: true,
          clinicNameSize: 'sm',
          borderBottom: true
        }
      },
      {
        id: 'block_title_3',
        type: 'title',
        title: 'Tiêu Đề Phiếu',
        visible: true,
        order: 2,
        props: {
          text: 'KẾT QUẢ XÉT NGHIỆM Y KHOA',
          fontSize: 'lg',
          textColor: '#0f766e',
          uppercase: true,
          align: 'center'
        }
      },
      {
        id: 'block_patient_3',
        type: 'patient_info',
        title: 'Thông Tin Bệnh Nhân Gọn',
        visible: true,
        order: 3,
        props: {
          layout: 'grid_2_cols',
          highlightName: true,
          highlightSampleCode: true,
          showSampleStatus: true,
          showDoctor: true,
          showReceivedAt: false,
          showReturnedAt: true
        }
      },
      {
        id: 'block_table_3',
        type: 'test_table',
        title: 'Bảng Xét Nghiệm Gọn',
        visible: true,
        order: 4,
        props: {
          columns: {
            stt: true,
            name: true,
            result: true,
            refRange: true,
            unit: true,
            equipment: false,
            price: false,
            note: false
          },
          groupByCategory: true,
          highlightAbnormal: true,
          fontSize: 'xs',
          density: 'compact'
        }
      },
      {
        id: 'block_conclusion_3',
        type: 'conclusion',
        title: 'Kết Luận',
        visible: true,
        order: 5,
        props: {
          title: 'KẾT LUẬN:',
          showBorder: true,
          bgColor: 'transparent',
          fontSize: 'xs'
        }
      },
      {
        id: 'block_signature_3',
        type: 'signature',
        title: 'Chữ Ký',
        visible: true,
        order: 6,
        props: {
          showDate: true,
          title: 'BÁC SĨ XÉT NGHIỆM',
          showStamp: true,
          showDoctorName: true,
          align: 'right'
        }
      }
    ]
  },

  // 4. MẪU TỐI GIẢN TIẾT KIỆM MỰC (MINIMALIST)
  {
    id: 'tpl_minimalist',
    name: 'Mẫu Tối Giản Tiết Kiệm Mực (Đen Trắng)',
    description: 'Không màu nền, nét viền thanh mảnh, phù hợp cho máy in laser đen trắng tiết kiệm mực.',
    category: 'general',
    isDefault: false,
    paperSize: 'A4',
    orientation: 'portrait',
    fontFamily: 'Times New Roman',
    primaryColor: '#334155',
    paddingMm: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'block_header_4',
        type: 'header',
        title: 'Header Đen Trắng',
        visible: true,
        order: 1,
        props: {
          showLogo: false,
          showClinicName: true,
          showAddress: true,
          showContact: true,
          showQr: true,
          clinicNameSize: 'md',
          borderBottom: true
        }
      },
      {
        id: 'block_title_4',
        type: 'title',
        title: 'Tiêu Đề',
        visible: true,
        order: 2,
        props: {
          text: 'PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM',
          fontSize: 'lg',
          textColor: '#000000',
          uppercase: true,
          align: 'center'
        }
      },
      {
        id: 'block_patient_4',
        type: 'patient_info',
        title: 'Bệnh Nhân',
        visible: true,
        order: 3,
        props: {
          layout: 'table_12_fields',
          highlightName: false,
          highlightSampleCode: false,
          showSampleStatus: true,
          showDoctor: true,
          showReceivedAt: true,
          showReturnedAt: true
        }
      },
      {
        id: 'block_table_4',
        type: 'test_table',
        title: 'Bảng Chỉ Số',
        visible: true,
        order: 4,
        props: {
          columns: {
            stt: true,
            name: true,
            result: true,
            refRange: true,
            unit: true,
            equipment: false,
            price: false,
            note: false
          },
          groupByCategory: true,
          highlightAbnormal: true,
          fontSize: 'sm',
          density: 'compact'
        }
      },
      {
        id: 'block_signature_4',
        type: 'signature',
        title: 'Chữ Ký',
        visible: true,
        order: 5,
        props: {
          showDate: true,
          title: 'PHỤ TRÁCH CHUYÊN MÔN',
          showStamp: false,
          showDoctorName: true,
          align: 'right'
        }
      }
    ]
  }
];
