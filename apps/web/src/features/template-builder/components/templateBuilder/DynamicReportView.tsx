import { memo, useMemo, useCallback, Fragment } from 'react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import {
  Patient,
  SelectedTest,
  ClinicInfo,
  TestPackage,
  AllergenGradingScale,
  TestEquipment,
  CatalogItemEquipmentLink,
  ReportTemplate,
  TemplateBlock,
  resolveTestEquipmentName,
  DEFAULT_CLINIC_INFO,
  getSafeClinicInfo,
  HeaderBlockProps,
  TitleBlockProps,
  PatientInfoBlockProps,
  TestTableBlockProps,
  AllergenSummaryBlockProps,
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
  CustomTextBlockProps,
  DividerBlockProps,
  SpacerBlockProps
} from '@domain';
import { evaluateResult } from '@domain/testResult';
import { AllergenReportDomainService } from '@domain/services/AllergenReportDomainService';
import { isAllergenTest, getAllergenBadgeSvg, getAllergenGradeClasses } from '@domain/allergenDetector';

const MOCK_DESIGN_REGULAR_TESTS: SelectedTest[] = [
  {
    code: 'GLU',
    name: 'Định lượng Glucose máu',
    result: '5.2',
    unit: 'mmol/L',
    refMin: 3.9,
    refMax: 6.4,
    refText: '3.9 - 6.4',
    category: 'Sinh hóa máu',
    price: 40000,
    equipmentId: 'eq_1',
    note: ''
  },
  {
    code: 'URE',
    name: 'Định lượng Ure',
    result: '5.4',
    unit: 'mmol/L',
    refMin: 2.5,
    refMax: 7.5,
    refText: '2.5 - 7.5',
    category: 'Sinh hóa máu',
    price: 40000,
    equipmentId: 'eq_1',
    note: ''
  },
  {
    code: 'CRE',
    name: 'Định lượng Creatinin',
    result: '82',
    unit: 'µmol/L',
    refMin: 62,
    refMax: 106,
    refText: '62 - 106',
    category: 'Sinh hóa máu',
    price: 45000,
    equipmentId: 'eq_1',
    note: ''
  },
  {
    code: 'AST',
    name: 'Đo hoạt độ AST (GOT)',
    result: '48',
    unit: 'U/L',
    refMin: 0,
    refMax: 37,
    refText: '< 37',
    category: 'Sinh hóa máu',
    price: 45000,
    equipmentId: 'eq_1',
    note: 'Tăng nhẹ'
  },
  {
    code: 'ALT',
    name: 'Đo hoạt độ ALT (GPT)',
    result: '52',
    unit: 'U/L',
    refMin: 0,
    refMax: 41,
    refText: '< 41',
    category: 'Sinh hóa máu',
    price: 45000,
    equipmentId: 'eq_1',
    note: 'Tăng nhẹ'
  }
];

const MOCK_DESIGN_ALLERGEN_TESTS: SelectedTest[] = [
  {
    code: 'd1',
    name: 'Mạt bụi nhà (D. pteronyssinus)',
    scientific: 'Dermatophagoides pteronyssinus',
    result: '18.4',
    unit: 'IU/ml',
    refText: '< 0.35',
    category: 'Dị nguyên',
    price: 150000,
    note: 'Độ 3'
  },
  {
    code: 'd2',
    name: 'Mạt bụi nhà (D. farinae)',
    scientific: 'Dermatophagoides farinae',
    result: '24.6',
    unit: 'IU/ml',
    refText: '< 0.35',
    category: 'Dị nguyên',
    price: 150000,
    note: 'Độ 4'
  },
  {
    code: 'e1',
    name: 'Lông biểu mô mèo',
    scientific: 'Cat dander',
    result: '3.8',
    unit: 'IU/ml',
    refText: '< 0.35',
    category: 'Dị nguyên',
    price: 150000,
    note: 'Độ 2'
  },
  {
    code: 'f24',
    name: 'Tôm biển',
    scientific: 'Shrimp',
    result: '55.2',
    unit: 'IU/ml',
    refText: '< 0.35',
    category: 'Dị nguyên',
    price: 150000,
    note: 'Độ 5'
  },
  {
    code: 'f1',
    name: 'Lòng trắng trứng gà',
    scientific: 'Egg white',
    result: '0.12',
    unit: 'IU/ml',
    refText: '< 0.35',
    category: 'Dị nguyên',
    price: 150000,
    note: 'Độ 0 (Âm tính)'
  },
  {
    code: 'TIgE',
    name: 'Tổng nồng độ IgE toàn phần',
    scientific: 'Total IgE',
    result: '142.0',
    unit: 'IU/ml',
    refText: '< 15.0',
    category: 'Dị nguyên',
    price: 180000,
    note: 'Tăng (> 15.0 IU/ml)'
  }
];

interface DynamicReportViewProps {
  template: ReportTemplate;
  patient: Patient;
  selectedTests?: SelectedTest[];
  clinicInfo?: ClinicInfo;
  doctorName?: string;
  conclusion?: string;
  qrCodeDataUrl?: string;
  testPackages?: TestPackage[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
  allergenScales?: AllergenGradingScale[];
  elementId?: string;
  isDesignMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onRemoveBlock?: (blockId: string) => void;
  onReorderBlock?: (blockId: string, direction: 'up' | 'down') => void;
  /** Khi kéo thả block từ palette xuống canvas: (blockType, afterBlockId?) */
  onDropBlock?: (blockType: string, afterBlockId?: string) => void;
}

export function DynamicReportView({
  template,
  patient,
  selectedTests = [],
  clinicInfo = DEFAULT_CLINIC_INFO,
  doctorName,
  conclusion,
  qrCodeDataUrl,
  testPackages = [],
  equipments = [],
  catalogItemEquipments = [],
  allergenScales = [],
  elementId = 'printable-dynamic-report',
  isDesignMode = false,
  selectedBlockId = null,
  onSelectBlock,
  onRemoveBlock,
  onReorderBlock,
  onDropBlock
}: DynamicReportViewProps) {
  const safeClinic = getSafeClinicInfo(clinicInfo);
  const currentLogo = clinicInfo?.logoUrl || golabLogo;
  const currentStamp = clinicInfo?.stampUrl || doctorStamp;

  const effectiveTests = useMemo(() => {
    if (selectedTests && selectedTests.length > 0) return selectedTests;
    if (isDesignMode) return [...MOCK_DESIGN_REGULAR_TESTS, ...MOCK_DESIGN_ALLERGEN_TESTS];
    return [];
  }, [selectedTests, isDesignMode]);

  const regularTests = useMemo(() => {
    return effectiveTests.filter((t) => !isAllergenTest(t));
  }, [effectiveTests]);

  const allergenTests = useMemo(() => {
    return effectiveTests.filter((t) => isAllergenTest(t));
  }, [effectiveTests]);

  const allergenDTO = useMemo(() => {
    if (allergenTests.length === 0) return null;
    return AllergenReportDomainService.buildReportDTO({
      tests: allergenTests,
      testPackages,
      customScales: allergenScales
    });
  }, [allergenTests, testPackages, allergenScales]);

  // Nhóm các chỉ số theo chuyên khoa (Category)
  const groupedRegularTests = useMemo(() => {
    const map = new Map<string, SelectedTest[]>();
    for (const t of regularTests) {
      const cat = (t.category && t.category.trim()) || 'Xét Nghiệm Khác';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return Array.from(map.entries());
  }, [regularTests]);

  // Sắp xếp các block theo `order` và lọc block `visible` (trong design mode thì hiển thị mờ nếu hidden)
  const sortedBlocks = useMemo(() => {
    const list = [...template.blocks].sort((a, b) => a.order - b.order);
    return isDesignMode ? list : list.filter((b) => b.visible);
  }, [template.blocks, isDesignMode]);

  /**
   * Kiểm tra xem block có dữ liệu thực tế để hiển thị không.
   * Dùng cho tính năng `autoHideWhenEmpty` và điều kiện hiển thị tự động.
   */
  const hasDataForBlock = useCallback(
    (block: TemplateBlock): boolean => {
      switch (block.type) {
        case 'test_table':
          return regularTests.length > 0;
        case 'conclusion':
          return !!(conclusion && conclusion.trim() !== '');
        case 'allergen_summary':
        case 'allergen_positive_table':
          return !!(allergenDTO && allergenDTO.positiveList.length > 0);
        case 'allergen_patient_summary':
        case 'allergen_header':
        case 'allergen_title':
        case 'allergen_scale_table':
        case 'allergen_symptoms_box':
        case 'allergen_tige_note':
        case 'allergen_detail_table':
        case 'allergen_detail':
        case 'allergen_prevention_guide':
        case 'allergen_scale':
        case 'allergen_cover_summary':
          return allergenTests.length > 0;
        default:
          return true; // header, title, patient_info, signature, divider, spacer, custom_text luôn có data
      }
    },
    [regularTests.length, conclusion, allergenDTO, allergenTests.length]
  );

  /**
   * Đánh giá điều kiện hiển thị tổng thể của một block:
   * Kết hợp cả `visible`, `visibilityCondition` và `autoHideWhenEmpty`.
   */
  const isBlockVisible = useCallback(
    (block: TemplateBlock): boolean => {
      if (!block.visible) return false;
      const cond = block.visibilityCondition || (block.autoHideWhenEmpty ? 'auto' : 'always');

      switch (cond) {
        case 'never':
          return false;
        case 'always':
          return true;
        case 'has_regular_tests':
          return regularTests.length > 0;
        case 'has_allergen_tests':
          return allergenTests.length > 0;
        case 'has_positive_allergens':
          return !!(allergenDTO && allergenDTO.positiveList.length > 0);
        case 'has_conclusion':
          return !!(conclusion && conclusion.trim() !== '');
        case 'auto':
        default:
          return hasDataForBlock(block);
      }
    },
    [regularTests.length, allergenTests.length, allergenDTO, conclusion, hasDataForBlock]
  );

  const renderBlockContent = (block: TemplateBlock) => {
    switch (block.type) {
      case 'header': {
        const p = block.props as HeaderBlockProps;
        return (
          <div className={`flex items-center justify-between ${p.borderBottom !== false ? 'border-b-2 border-sky-600 pb-3 mb-3' : 'pb-2 mb-2'}`}>
            <div className="flex items-center space-x-4">
              {p.showLogo !== false && (
                <div className="h-[68px] w-[130px] flex items-center justify-center shrink-0">
                  <img src={currentLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div>
                <p className="text-[12px] font-bold text-sky-800 uppercase tracking-widest leading-none mb-1">
                  HỆ THỐNG XÉT NGHIỆM GOLAB
                </p>
                {p.showClinicName !== false && (
                  <h1 className={`${p.clinicNameSize === 'lg' ? 'text-[18px]' : p.clinicNameSize === 'sm' ? 'text-[14px]' : 'text-[16px]'} font-black text-sky-950 uppercase tracking-tight`}>
                    {safeClinic.name}
                  </h1>
                )}
                {p.showAddress !== false && (
                  <p className="text-[12px] text-slate-700 font-medium">
                    Địa chỉ: {safeClinic.address}
                  </p>
                )}
                {p.showContact !== false && (
                  <p className="text-[11.5px] text-slate-700 font-medium">
                    Website: <strong className="text-sky-800">{safeClinic.website}</strong> – Hotline: <strong className="text-sky-800">{safeClinic.phone}</strong>
                  </p>
                )}
              </div>
            </div>
            {p.showQr !== false && (
              <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded shadow-2xs shrink-0 min-w-[58px]">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-[9px] text-slate-400 font-mono">
                    QR
                  </div>
                )}
                <span className="text-[8.5px] font-mono text-sky-800 font-extrabold mt-0.5 tracking-tight">Tra Cứu</span>
              </div>
            )}
          </div>
        );
      }

      case 'title': {
        const p = block.props as TitleBlockProps;
        const alignClass = p.align === 'left' ? 'text-left' : p.align === 'right' ? 'text-right' : 'text-center';
        const sizeClass = p.fontSize === 'xl' ? 'text-[22px]' : p.fontSize === 'lg' ? 'text-[18px]' : p.fontSize === 'sm' ? 'text-[14px]' : 'text-[16px]';
        return (
          <div className={`${alignClass} my-3`}>
            <h2 className={`${sizeClass} font-black text-slate-900 ${p.uppercase !== false ? 'uppercase' : ''} tracking-wide`} style={{ color: p.textColor || undefined }}>
              {p.text || 'PHIẾU KẾT QUẢ XÉT NGHIỆM'}
            </h2>
            {p.subtitle && (
              <p className="text-[12px] text-slate-600 italic mt-0.5">{p.subtitle}</p>
            )}
          </div>
        );
      }

      case 'patient_info': {
        const p = block.props as PatientInfoBlockProps;
        if (p.layout === 'grid_2_cols') {
          return (
            <div className="border border-slate-300 rounded mb-3 bg-white p-2.5 text-[12px] grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div><span className="text-slate-500 font-medium">Họ tên:</span> <strong className={`uppercase ${p.highlightName ? 'text-red-600' : 'text-slate-900'}`}>{patient.name || '---'}</strong></div>
              <div><span className="text-slate-500 font-medium">Mã BN / Số BP:</span> <strong className="font-mono">{patient.code} / <span className={p.highlightSampleCode ? 'text-red-600' : ''}>{patient.sampleCode || patient.code}</span></strong></div>
              <div><span className="text-slate-500 font-medium">Năm sinh / Tuổi:</span> {patient.dob || '---'} ({patient.gender || 'Nam'})</div>
              <div><span className="text-slate-500 font-medium">Bác sĩ chỉ định:</span> {patient.doctor || doctorName || '---'}</div>
              <div><span className="text-slate-500 font-medium">Địa chỉ:</span> {patient.address || '---'}</div>
              <div><span className="text-slate-500 font-medium">Thời gian:</span> {patient.receivedAt || new Date().toLocaleDateString('vi-VN')}</div>
            </div>
          );
        }

        // Default 12 fields table layout
        return (
          <div className="border border-slate-300 rounded mb-3.5 bg-white text-[12px]">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Họ và tên:</td>
                  <td className={`py-1.5 px-3 font-bold uppercase border-r border-b border-slate-300 align-middle ${p.highlightName !== false ? 'text-red-600 text-[13px]' : 'text-slate-900'}`}>{patient.name || '---'}</td>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">T/G chỉ định</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle">{patient.orderedAt || new Date().toLocaleDateString('vi-VN')}</td>
                </tr>
                <tr>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Năm sinh:</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle">{patient.dob || '---'}</td>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">T/G đóng phí</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle">{patient.paidAt || new Date().toLocaleDateString('vi-VN')}</td>
                </tr>
                <tr>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Địa chỉ</td>
                  <td className="py-1.5 px-3 text-slate-800 border-r border-b border-slate-300 align-middle">{patient.address || 'Đồng Hới, Quảng Bình'}</td>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Số bệnh phẩm</td>
                  <td className={`py-1.5 px-3 font-mono font-bold border-b border-slate-300 align-middle ${p.highlightSampleCode !== false ? 'text-red-600 text-[13px]' : 'text-slate-900'}`}>{patient.sampleCode || patient.code}</td>
                </tr>
                <tr>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Giới tính:</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800 border-r border-b border-slate-300 align-middle">{patient.gender || 'Nam'}</td>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Tình trạng mẫu</td>
                  <td className="py-1.5 px-3 font-medium text-emerald-700 font-bold border-b border-slate-300 align-middle">{patient.sampleStatus || 'Đạt'}</td>
                </tr>
                <tr>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">Số điện thoại</td>
                  <td className="py-1.5 px-3 font-mono text-slate-800 border-r border-b border-slate-300 align-middle">{patient.phone || '---'}</td>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-b border-slate-300 align-middle">T/G nhận mẫu</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800 border-b border-slate-300 align-middle">{patient.receivedAt || new Date().toLocaleDateString('vi-VN')}</td>
                </tr>
                <tr>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle">Bác sĩ chỉ định</td>
                  <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-300 align-middle">{patient.doctor || doctorName || 'BS. Trần Hoài Long'}</td>
                  <td className="w-32 py-1.5 px-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-300 align-middle">T/G trả kết quả</td>
                  <td className="py-1.5 px-3 font-medium text-slate-800 align-middle">{patient.returnedAt || new Date().toLocaleDateString('vi-VN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      }

      case 'test_table': {
        const p = block.props as TestTableBlockProps;
        const cols = p.columns || { stt: true, name: true, result: true, refRange: true, unit: true, equipment: true };
        const densityClass = p.density === 'compact' ? 'py-0.5 px-1.5' : p.density === 'relaxed' ? 'py-2 px-3' : 'py-1 px-2';
        const fontSizeClass = p.fontSize === 'xs' ? 'text-[11px]' : p.fontSize === 'md' ? 'text-[13px]' : 'text-[12px]';

        let rowCounter = 0;

        return (
          <div className="border border-slate-300 rounded mb-3 bg-white overflow-hidden">
            <table className={`w-full ${fontSizeClass} border-collapse`}>
              <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
                <tr>
                  {cols.stt && <th className="py-2 px-2 w-8 text-center border-r border-slate-300 align-middle leading-snug">STT</th>}
                  {cols.name && <th className="py-2 px-2.5 text-left border-r border-slate-300 align-middle leading-snug">TÊN CHỈ SỐ XÉT NGHIỆM</th>}
                  {cols.result && <th className="py-2 px-2 w-24 text-center border-r border-slate-300 align-middle leading-snug">KẾT QUẢ</th>}
                  {cols.unit && <th className="py-2 px-1.5 w-16 text-center border-r border-slate-300 align-middle leading-snug">ĐƠN VỊ</th>}
                  {cols.refRange && <th className="py-2 px-2 w-32 text-center border-r border-slate-300 align-middle leading-snug">TRỊ SỐ THAM CHIẾU</th>}
                  {cols.equipment && <th className="py-2 px-2 w-36 text-center border-r border-slate-300 align-middle leading-snug">THIẾT BỊ XỬ LÝ</th>}
                  {cols.price && <th className="py-2 px-2 w-24 text-right border-r border-slate-300 align-middle leading-snug">GIÁ TIỀN</th>}
                  {cols.note && <th className="py-2 px-2 text-left align-middle leading-snug">GHI CHÚ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {p.groupByCategory !== false ? (
                  groupedRegularTests.map(([category, items]) => (
                    <Fragment key={category}>
                      <tr className="bg-sky-50 font-bold text-sky-950">
                        <td colSpan={10} className="py-1 px-2.5 uppercase tracking-wide text-[11.5px] border-y border-slate-300">
                          • {category}
                        </td>
                      </tr>
                      {items.map((t, idx) => {
                        rowCounter++;
                        const evaluation = evaluateResult(t.result, t.refMin, t.refMax);
                        const isAbnormal = evaluation.status === 'high' || evaluation.status === 'low';
                        const resolvedEquipment = resolveTestEquipmentName(t, equipments, catalogItemEquipments);

                        return (
                          <tr key={`${t.code}-${idx}`} className={`hover:bg-slate-50 ${isAbnormal && p.highlightAbnormal !== false ? 'bg-red-50/40' : ''}`}>
                            {cols.stt && <td className={`${densityClass} text-center font-mono text-slate-500 border-r border-slate-200`}>{rowCounter}</td>}
                            {cols.name && (
                              <td className={`${densityClass} font-bold text-slate-900 border-r border-slate-200`}>
                                {t.name}
                                {t.scientific && <span className="text-[10px] text-slate-500 italic block font-normal">{t.scientific}</span>}
                              </td>
                            )}
                            {cols.result && (
                              <td className={`${densityClass} text-center font-mono text-[13px] border-r border-slate-200 ${isAbnormal && p.highlightAbnormal !== false ? 'text-red-600 font-black' : 'text-slate-900 font-bold'}`}>
                                {t.result || '---'}
                              </td>
                            )}
                            {cols.unit && <td className={`${densityClass} text-center font-mono text-slate-700 text-[11.5px] border-r border-slate-200`}>{t.unit || '---'}</td>}
                            {cols.refRange && (
                              <td className={`${densityClass} text-center font-mono text-slate-700 text-[11.5px] border-r border-slate-200`}>
                                {t.refText || (t.refMin !== undefined && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : '---')}
                              </td>
                            )}
                            {cols.equipment && <td className={`${densityClass} text-center text-slate-600 text-[11px] truncate max-w-[150px] border-r border-slate-200`}>{resolvedEquipment || '---'}</td>}
                            {cols.price && <td className={`${densityClass} text-right font-mono text-slate-800 text-[11.5px] border-r border-slate-200`}>{t.price ? `${t.price.toLocaleString('vi-VN')} đ` : '---'}</td>}
                            {cols.note && <td className={`${densityClass} text-slate-700 font-semibold text-[11px]`}>{t.note || (isAbnormal ? evaluation.label : 'Bình thường')}</td>}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))
                ) : (
                  regularTests.map((t, idx) => {
                    const evaluation = evaluateResult(t.result, t.refMin, t.refMax);
                    const isAbnormal = evaluation.status === 'high' || evaluation.status === 'low';
                    const resolvedEquipment = resolveTestEquipmentName(t, equipments, catalogItemEquipments);

                    return (
                      <tr key={`${t.code}-${idx}`} className={`hover:bg-slate-50 ${isAbnormal && p.highlightAbnormal !== false ? 'bg-red-50/40' : ''}`}>
                        {cols.stt && <td className={`${densityClass} text-center font-mono text-slate-500 border-r border-slate-200`}>{idx + 1}</td>}
                        {cols.name && (
                          <td className={`${densityClass} font-semibold text-slate-900 border-r border-slate-200`}>
                            {t.name}
                          </td>
                        )}
                        {cols.result && (
                          <td className={`${densityClass} text-center font-mono text-[13px] border-r border-slate-200 ${isAbnormal && p.highlightAbnormal !== false ? 'text-red-600 font-black' : 'text-slate-900 font-bold'}`}>
                            {t.result || '---'}
                          </td>
                        )}
                        {cols.refRange && (
                          <td className={`${densityClass} text-center font-mono text-slate-600 text-[11.5px] border-r border-slate-200`}>
                            {t.refText || (t.refMin !== undefined && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : '---')}
                          </td>
                        )}
                        {cols.unit && <td className={`${densityClass} text-center font-mono text-slate-600 text-[11.5px] border-r border-slate-200`}>{t.unit || '---'}</td>}
                        {cols.equipment && <td className={`${densityClass} text-slate-600 text-[11px] truncate max-w-[160px] border-r border-slate-200`}>{resolvedEquipment}</td>}
                        {cols.price && <td className={`${densityClass} text-right font-mono text-slate-800 text-[11.5px] border-r border-slate-200`}>{t.price ? `${t.price.toLocaleString('vi-VN')} đ` : '---'}</td>}
                        {cols.note && <td className={`${densityClass} text-slate-600 text-[11px]`}>{t.note || '---'}</td>}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case 'allergen_summary': {
        const p = block.props as AllergenSummaryBlockProps;
        if (!allergenDTO || allergenDTO.positiveList.length === 0) {
          if (p.showNegativeNotice !== false) {
            return (
              <div className="border border-emerald-300 rounded p-2.5 mb-3 bg-emerald-50/60 text-[12px] text-emerald-950 font-medium">
                🌿 <strong>TỔNG HỢP DỊ NGUYÊN:</strong> Âm tính (Độ 0 - Không phản ứng) với toàn bộ các dị nguyên trong gói tầm soát.
              </div>
            );
          }
          return null;
        }

        return (
          <div className="border-2 border-red-300 rounded mb-3 bg-red-50/30 p-2.5">
            <h3 className="text-[13px] font-bold text-red-900 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{p.title || 'TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH'}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11.5px]">
              {allergenDTO.positiveList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded border border-red-200">
                  <div className="flex items-center space-x-2">
                    <img src={getAllergenBadgeSvg(item.grade, 18)} alt={`Độ ${item.grade}`} className="w-4.5 h-4.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900">{item.name}</span>
                      {p.showRoute && item.route && <span className="text-[10px] text-slate-500 block">{item.route}</span>}
                    </div>
                  </div>
                  {p.showConcentration && <span className="font-mono font-bold text-red-600">{item.result} IU/ml</span>}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ─── CHUYÊN BIỆT DỊ NGUYÊN TRANG 2, 3, 4 ───

      case 'allergen_header': {
        const p = block.props as AllergenHeaderBlockProps;
        return (
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
            <div className="flex items-center space-x-3">
              {p.showLogo !== false && (
                <img
                  src={currentLogo}
                  alt="Logo"
                  className="h-14 w-auto object-contain max-w-[120px]"
                />
              )}
              <div>
                {p.showClinicName !== false && (
                  <h1 className="text-[17px] font-black uppercase text-sky-950 tracking-tight leading-none mb-1">
                    {clinicInfo?.name || 'PHÒNG XÉT NGHIỆM Y KHOA GOLAB'}
                  </h1>
                )}
                {p.showAddress !== false && (
                  <p className="text-[11.5px] text-slate-600 leading-tight">
                    {clinicInfo?.address || 'Địa chỉ: 123 Đường Y Học, Phường 1, TP. Đồng Hới'}
                  </p>
                )}
                {p.showContact !== false && (
                  <p className="text-[11.5px] text-slate-600 leading-tight">
                    Hotline: <strong className="text-slate-800">{clinicInfo?.phone || '032.855.3773'}</strong> {clinicInfo?.website ? `| Website: ${clinicInfo.website}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div
                className="inline-flex items-center justify-center text-white font-black text-[12.5px] px-3.5 py-1 rounded tracking-wide uppercase leading-normal shadow-xs"
                style={{ backgroundColor: p.badgeColor || '#dc2626' }}
              >
                {p.badgeText || 'Báo Cáo Dị Nguyên'}
              </div>
            </div>
          </div>
        );
      }

      case 'allergen_title': {
        const p = block.props as AllergenTitleBlockProps;
        const alignClass = p.align === 'left' ? 'text-left' : p.align === 'right' ? 'text-right' : 'text-center';
        return (
          <div className={`${alignClass} mb-3`}>
            <h2 className="text-[19px] font-black text-slate-900 uppercase tracking-wide" style={{ color: p.textColor || undefined }}>
              {p.text || 'KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU'}
            </h2>
            {p.subtitle && (
              <p className="text-[13px] font-bold italic mt-0.5" style={{ color: p.subtitleColor || '#b91c1c' }}>
                {p.subtitle}
              </p>
            )}
          </div>
        );
      }

      case 'allergen_patient_summary': {
        const p = block.props as AllergenPatientSummaryBlockProps;
        return (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-300 rounded px-4 py-1.5 mb-2 text-[13px] leading-snug">
            {p.showName !== false && (
              <div>
                <span className="font-semibold text-slate-600">Họ tên: </span>
                <strong className={`uppercase font-bold text-[14px] ${p.highlightName !== false ? 'text-red-600' : 'text-slate-900'}`}>{patient.name || '---'}</strong>
              </div>
            )}
            {p.showDob !== false && (
              <div>
                <span className="font-semibold text-slate-600">Năm sinh: </span>
                <strong className="text-slate-800">{patient.dob || '---'}</strong>
              </div>
            )}
            {p.showGender !== false && (
              <div>
                <span className="font-semibold text-slate-600">Giới tính: </span>
                <strong className="text-slate-800">{patient.gender || 'Nam'}</strong>
              </div>
            )}
            <div>
              <span className="font-semibold text-slate-600">Loại mẫu: </span>
              <strong className="text-slate-800">{p.sampleType || 'Huyết thanh'}</strong>
            </div>
          </div>
        );
      }

      case 'allergen_positive_table': {
        const p = block.props as AllergenPositiveTableBlockProps;
        const posList = allergenDTO?.positiveList || [];
        return (
          <div className="mb-2">
            <div className="border border-slate-300 rounded bg-white overflow-hidden">
              <table className="w-full text-[13px] border-collapse">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b-2 border-slate-300">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center border-r border-slate-300 align-middle leading-snug">STT</th>
                    <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">LOẠI DỊ NGUYÊN</th>
                    {p.showScientific !== false && <th className="py-2 px-4 text-left border-r border-slate-300 align-middle leading-snug">TÊN KHOA HỌC</th>}
                    {p.showCode !== false && <th className="py-2 px-3 w-20 text-center border-r border-slate-300 align-middle leading-snug">MÃ</th>}
                    <th className="py-2 px-4 w-32 text-center align-middle leading-snug">ĐỘ DƯƠNG TÍNH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {posList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-slate-500 italic text-[13px]">
                        {p.emptyNotice || 'Chưa phát hiện dị nguyên dương tính'}
                      </td>
                    </tr>
                  ) : (
                    posList.map((pos, idx) => {
                      const gradeStyle = getAllergenGradeClasses(pos.grade, pos.isTIgE, pos.isPositive);
                      return (
                        <tr key={pos.code || idx} className={`${gradeStyle.rowBg} font-bold ${gradeStyle.textColor} text-[13.5px]`}>
                          <td className="py-2 px-3 text-center border-r border-slate-300 align-middle leading-snug">{idx + 1}</td>
                          <td className={`py-2 px-4 border-r border-slate-300 align-middle leading-snug ${gradeStyle.nameColor}`}>{pos.name}</td>
                          {p.showScientific !== false && <td className="py-2 px-4 border-r border-slate-300 italic font-medium opacity-90 align-middle leading-snug">{pos.allergenName}</td>}
                          {p.showCode !== false && <td className="py-2 px-3 text-center font-mono border-r border-slate-300 align-middle leading-snug">{pos.code}</td>}
                          <td className="py-2 px-4 text-center align-middle leading-snug">
                            {pos.isTIgE ? (
                              <span className={`text-[12.5px] font-bold ${pos.isPositive ? 'text-red-700' : 'text-sky-900'}`}>
                                {pos.result || '---'} <span className="text-slate-500 text-[10px] font-normal">(IU/ml)</span>
                              </span>
                            ) : (
                              <div className="flex items-center justify-center">
                                <img
                                  src={getAllergenBadgeSvg(pos.grade, 20)}
                                  width={20}
                                  height={20}
                                  alt={`Độ ${pos.grade}`}
                                  className="inline-block align-middle"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {p.footnote && (
              <p className="text-[12px] text-slate-500 italic text-right mt-1 mb-2">
                {p.footnote}
              </p>
            )}
          </div>
        );
      }

      case 'allergen_scale_table': {
        const p = block.props as AllergenScaleTableBlockProps;
        const scales = allergenDTO?.appliedScales || allergenScales || [];
        return (
          <div className="space-y-2 mb-2">
            {scales.map((scale, sIdx) => (
              <div key={scale.id || sIdx} className="border border-slate-300 rounded bg-white overflow-hidden">
                <div className="bg-slate-100 py-1.5 px-2 text-center font-bold text-red-700 text-[12px] uppercase border-b-2 border-slate-300">
                  {scale.name || p.title || 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH'}
                </div>
                <table className="w-full text-[11.5px] border-collapse">
                  <thead className="bg-slate-50 font-bold border-b border-slate-300">
                    <tr>
                      <th className="h-7 py-0 px-1.5 text-center border-r border-slate-300 align-middle w-12">ĐỘ (+)</th>
                      <th className="h-7 py-0 px-1.5 text-center border-r border-slate-300 align-middle">NỒNG ĐỘ ({scale.unit || 'IU/ml'})</th>
                      <th className="h-7 py-0 px-1.5 text-center align-middle">DIỄN GIẢI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {scale.levels.map((level) => {
                      const gradeStyle = getAllergenGradeClasses(level.grade);
                      return (
                        <tr key={level.grade} className={gradeStyle.rowBg}>
                          <td className="h-7 py-0 text-center border-r border-slate-300 font-bold align-middle">
                            <div className="flex items-center justify-center">
                              <img
                                src={getAllergenBadgeSvg(level.grade, 18)}
                                width={18}
                                height={18}
                                alt={`Độ ${level.grade}`}
                                className="inline-block align-middle"
                              />
                            </div>
                          </td>
                          <td className={`h-7 py-0 text-center font-mono border-r border-slate-300 align-middle ${level.isPositive ? gradeStyle.textColor + ' font-bold' : 'text-slate-600'}`}>
                            {level.rangeText}
                          </td>
                          <td className={`h-7 py-0 text-center align-middle ${level.isPositive ? gradeStyle.textColor + ' font-bold' : 'text-slate-700 font-semibold'}`}>
                            {level.label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );
      }

      case 'allergen_symptoms_box': {
        const p = block.props as AllergenSymptomsBoxBlockProps;
        return (
          <div className="border border-slate-300 rounded text-[12px] leading-relaxed bg-slate-50/50 flex flex-col mb-2 overflow-hidden">
            <div className="text-center font-bold text-red-700 text-[12.5px] uppercase py-1.5 px-2 border-b border-slate-300">
              {p.title || 'MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG'}
            </div>
            <div className="flex-1 flex flex-col justify-center px-3 py-2 space-y-1.5">
              {p.showSkin !== false && (
                <p className="flex items-start gap-1">
                  <strong className="text-slate-900 shrink-0">Da, niêm mạc:</strong>
                  <span>nổi mề đay, phát ban, viêm da; ngứa, sưng môi, lưỡi, miệng, mắt đỏ, viêm kết mạc.</span>
                </p>
              )}
              {p.showRespiratory !== false && (
                <p className="flex items-start gap-1">
                  <strong className="text-slate-900 shrink-0">Hô hấp:</strong>
                  <span>ho, khó thở, hắt hơi, sổ mũi, khò khè, hen suyễn, viêm phổi.</span>
                </p>
              )}
              {p.showDigestive !== false && (
                <p className="flex items-start gap-1">
                  <strong className="text-slate-900 shrink-0">Tiêu hóa:</strong>
                  <span>nuốt khó, nôn, đau bụng, đầy hơi, tiêu chảy.</span>
                </p>
              )}
              {p.showSevere !== false && (
                <p className="flex items-start gap-1">
                  <strong className="text-slate-900 shrink-0">Thần kinh &amp; Nặng:</strong>
                  <span>đau đầu, chóng mặt; Sốt, sốc phản vệ.</span>
                </p>
              )}
            </div>
            {p.warningText && (
              <p className="text-red-700 font-bold italic px-3 py-1.5 border-t border-slate-300 text-[11.5px]">
                {p.warningText}
              </p>
            )}
          </div>
        );
      }

      case 'allergen_tige_note': {
        const p = block.props as AllergenTigeNoteBlockProps;
        return (
          <div className="mt-2 border border-sky-300 rounded bg-sky-50/40 mb-3 overflow-hidden">
            <table className="w-full text-[12px] border-collapse">
              <thead className="bg-sky-100/70 font-bold border-b border-sky-300">
                <tr>
                  <th colSpan={2} className="py-1.5 px-2 text-center text-sky-900 text-[12.5px] uppercase tracking-wide align-middle leading-snug">
                    {p.title || 'Ghi chú: Tổng nồng độ IgE (TIgE)'}
                  </th>
                </tr>
                <tr className="border-t border-sky-200">
                  <th className="py-1 px-2 text-center border-r border-sky-300 w-1/2 align-middle leading-snug">GIÁ TRỊ BÌNH THƯỜNG (IU/ml)</th>
                  <th className="py-1 px-2 text-center w-1/2 align-middle leading-snug">DIỄN GIẢI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-red-600 border-r border-sky-300 text-[13px] align-middle leading-snug">
                    {p.normalRange || '<15,0'}
                  </td>
                  <td className="py-1.5 px-2 text-center font-semibold text-slate-700 text-[12.5px] align-middle leading-snug">
                    {p.interpretation || 'Mức bình thường — Không tính Độ (+), chỉ có Kết Quả (IU/ml)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      }

      case 'allergen_detail_table':
      case 'allergen_detail': {
        const p = block.props as AllergenDetailTableBlockProps;
        const allItems = allergenDTO?.detailPages.flat() || [];
        const cols = p.columns || {
          tt: true,
          code: true,
          name: true,
          allergenName: true,
          route: true,
          normalRef: true,
          result: true,
          grade: true,
          note: true
        };

        return (
          <div className="mb-3">
            <div className="text-center mb-2.5">
              <h2 className="text-[17px] font-black text-slate-900 uppercase tracking-wide">
                {p.title || `CHI TIẾT KẾT QUẢ XÉT NGHIỆM ${allItems.length} DỊ NGUYÊN`}
              </h2>
            </div>
            <div className="border border-slate-300 rounded bg-white overflow-hidden">
              <table className="w-full text-[11.5px] border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-300">
                  <tr>
                    {cols.tt && <th className="py-2 px-1 w-7 text-center border-r border-slate-300 align-middle leading-snug">TT</th>}
                    {cols.code && <th className="py-2 px-1 w-12 text-center border-r border-slate-300 align-middle leading-snug">CODE</th>}
                    {cols.name && <th className="py-2 px-2 text-left border-r border-slate-300 align-middle leading-snug">TÊN CHỈ SỐ</th>}
                    {cols.allergenName && <th className="py-2 px-2 text-left border-r border-slate-300 align-middle leading-snug">TÊN DỊ NGUYÊN</th>}
                    {cols.route && <th className="py-2 px-2 w-28 text-left border-r border-slate-300 align-middle leading-snug">Đường dị ứng</th>}
                    {cols.normalRef && <th className="py-2 px-1.5 w-20 text-center border-r border-slate-300 leading-tight align-middle">BÌNH THƯỜNG<br/>(IU/ml)</th>}
                    {cols.result && <th className="py-2 px-1.5 w-20 text-center border-r border-slate-300 leading-tight align-middle">KẾT QUẢ<br/>(IU/ml)</th>}
                    {cols.grade && <th className="py-2 px-1 w-10 text-center border-r border-slate-300 leading-tight align-middle">ĐỘ<br/>(+)</th>}
                    {cols.note && <th className="py-2 px-2 text-left align-middle leading-snug">GHI CHÚ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {allItems.map((item, idx) => {
                    const gradeStyle = getAllergenGradeClasses(item.grade, item.isTIgE, item.isPositive);
                    const resultTextColor = item.isPositive ? `${gradeStyle.textColor} font-bold` : 'text-slate-800';

                    return (
                      <tr key={item.code || idx} className={`hover:bg-slate-50 ${gradeStyle.rowBg}`}>
                        {cols.tt && <td className="py-1.5 px-1 text-center font-mono text-slate-500 border-r border-slate-300 align-middle leading-snug">{item.tt}</td>}
                        {cols.code && <td className="py-1.5 px-1 text-center font-mono font-bold text-sky-800 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.code}</td>}
                        {cols.name && <td className={`py-1.5 px-2 font-semibold ${item.isPositive ? gradeStyle.nameColor : 'text-slate-900'} border-r border-slate-300 text-[12px] align-middle leading-snug`}>{item.name}</td>}
                        {cols.allergenName && <td className="py-1.5 px-2 italic text-slate-600 border-r border-slate-300 text-[12px] align-middle leading-snug">{item.allergenName}</td>}
                        {cols.route && <td className="py-1.5 px-2 text-slate-600 border-r border-slate-300 text-[11px] align-middle leading-snug">{item.route}</td>}
                        {cols.normalRef && <td className="py-1.5 px-1.5 text-center font-mono text-slate-600 border-r border-slate-300 text-[11.5px] align-middle leading-snug">{item.normalRef}</td>}
                        {cols.result && (
                          <td className={`py-1.5 px-1.5 text-center font-mono border-r border-slate-300 text-[12.5px] align-middle leading-snug ${resultTextColor}`}>
                            {item.result}
                          </td>
                        )}
                        {cols.grade && (
                          <td className="py-1.5 px-1 text-center align-middle leading-snug">
                            {item.isTIgE ? '' : (item.isPositive ? (
                              <div className="flex items-center justify-center">
                                <img
                                  src={getAllergenBadgeSvg(item.grade, 18)}
                                  width={18}
                                  height={18}
                                  alt={`Độ ${item.grade}`}
                                  className="inline-block align-middle"
                                />
                              </div>
                            ) : '')}
                          </td>
                        )}
                        {cols.note && (
                          <td className="py-1.5 px-2 text-slate-600 text-[11px] leading-snug align-middle">
                            {item.isTIgE ? (
                              item.isPositive ? (
                                <span className="font-bold text-red-600">Tăng (&gt; 15,0 IU/ml)</span>
                              ) : (
                                <span className="italic text-slate-600">{item.note || 'Bình thường'}</span>
                              )
                            ) : (
                              item.note
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'allergen_prevention_guide':
      case 'allergen_scale': {
        const p = block.props as AllergenPreventionGuideBlockProps;
        return (
          <div className="mb-4 bg-white p-2">
            <div className="text-center mb-4 pt-1">
              <h2 className="text-[20px] font-black text-red-700 uppercase tracking-wide">
                {p.title || 'MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG'}
              </h2>
            </div>
            <div className="text-[13.5px] text-slate-800 leading-relaxed space-y-3 text-justify">
              <p>
                <strong>1.</strong> Tìm nguyên nhân gây dị ứng hoặc dị ứng chéo bằng các xét nghiệm tìm dị nguyên. Nhiều trường hợp xét nghiệm dị nguyên vẫn không tìm ra nguyên nhân là do có nhiều dị nguyên hiện chưa được đưa vào xét nghiệm.
              </p>
              <p>
                <strong>2.</strong> Khi xét nghiệm không tìm thấy nguyên nhân dị ứng thì cần tiến hành cô lập từng yếu tố theo đường ăn uống (thực phẩm, đồ uống...), đường thở và tiếp xúc với môi trường (phấn hoa thường liên quan đến mùa, bụi, mạt, nấm, vi khuẩn... ở nhà, nơi công tác hay nơi di chuyển) để tìm nguyên nhân.
              </p>
              <div>
                <p>
                  <strong>3.</strong> Mức độ dị ứng tỷ thuận với số lần tiếp xúc với nguồn gây dị ứng, nhiều dị nguyên ngoài việc kích thích cơ thể gây dị ứng còn gây ra tình trạng phản ứng chéo với các loại khác làm tình trạng dị ứng thêm trầm trọng. Vì vậy, cần hạn chế tiếp xúc với nguồn có chứa hoặc nghi có chứa chất gây dị ứng bằng các biện pháp sau:
                </p>
                <div className="pl-4 pt-1.5 space-y-1 text-[13px] text-slate-700">
                  <p><strong>a.</strong> Mặc áo kín, đeo khẩu trang, kính để tránh da tiếp xúc với các bụi và phấn hoa... khi làm vệ sinh trong nhà hay đi ngoài đường;</p>
                  <p><strong>b.</strong> Không ăn các thức ăn, đồ uống đã từng hoặc nghi gây dị ứng đặc biệt là các thực phẩm có khả năng gây dị ứng cao như: động vật biển (tôm, cua...);</p>
                  <p><strong>c.</strong> Thường xuyên vệ sinh cá nhân, giặt quần áo để hạn chế nguồn gây dị ứng tiếp xúc với các bộ phận của cơ thể;</p>
                  <p><strong>d.</strong> Hạn chế vật nuôi trong nhà đối với những người có cơ địa dị ứng vì đó là nguồn dị ứng trực tiếp hoặc gây ra dị ứng chéo với các dị nguyên khác;</p>
                  <p><strong>e.</strong> Thường xuyên vệ sinh cá nhân, nhà, nền nhà, các đồ vật trong nhà để chống bụi và loại bỏ các vi sinh vật tồn tại, phát triển. Nên sử dụng máy hút bụi thay cho việc quét hoặc lau nhà để hạn chế tiếp xúc với nguồn bụi;</p>
                  <p><strong>f.</strong> Đóng cửa và hạn chế đi ra ngoài nếu ở vùng sinh sống có loài hoa, cỏ hoặc thực vật là nguồn gây dị ứng đặc biệt là mùa hoa nở các phấn hoa phát tán mạnh trong không khí;</p>
                  <p><strong>g.</strong> Lựa chọn quần áo rộng và các chất liệu phù hợp vì vải và các thuốc nhuộm vải cũng là nguồn gây dị ứng;</p>
                  <p><strong>h.</strong> Không phơi quần áo ngoài trời vì có khả năng phấn hoa có thể bám vào quần áo;</p>
                  <p><strong>i.</strong> Cần thông báo và tư vấn bác sỹ trước khi dùng thuốc đối với những người có biểu hiện dị ứng.</p>
                  <p><strong>j.</strong> Nếu tất cả các biện pháp trên không hiệu quả cần đi khám bác sỹ để được tư vấn.</p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'allergen_cover_summary': {
        const p = block.props as AllergenCoverSummaryBlockProps;
        const matchedPackage = testPackages?.find((pkg) => pkg.items?.some((i) => allergenTests.some((at) => at.code === i.code)));
        return (
          <div className="border-2 border-purple-300 rounded mb-3 bg-purple-50/40 p-3">
            <h3 className="text-[13px] font-bold text-purple-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <span>🔬</span>
              <span>{p.boxTitle || 'TỔNG QUAN GÓI TẦM SOÁT DỊ NGUYÊN'}</span>
            </h3>
            <div className="flex items-center justify-between text-[12px] text-slate-800">
              {p.showPackageName !== false && (
                <div>
                  <span className="text-slate-500 font-medium">Tên gói: </span>
                  <strong className="text-purple-900 font-bold">{matchedPackage?.name || 'Gói Dị Nguyên Chuyên Sâu'}</strong>
                </div>
              )}
              {p.showItemCount !== false && (
                <div>
                  <span className="text-slate-500 font-medium">Số lượng dị nguyên: </span>
                  <strong className="text-purple-900 font-mono font-bold">{allergenDTO?.totalCount || allergenTests.length} dị nguyên</strong>
                </div>
              )}
              {p.showPackagePrice !== false && matchedPackage?.price && (
                <div>
                  <span className="text-slate-500 font-medium">Giá gói: </span>
                  <strong className="text-emerald-700 font-mono font-bold">{matchedPackage.price.toLocaleString('vi-VN')} đ</strong>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'page_break': {
        const p = block.props as PageBreakBlockProps;
        return (
          <div className="my-4 py-2 border-y-2 border-dashed border-sky-400 bg-sky-50/60 rounded text-center text-xs font-bold text-sky-800 flex items-center justify-center gap-2 print:hidden select-none">
            <span>📄</span>
            <span>{p.label || 'Ngắt Trang In A4 (Page Break)'}</span>
          </div>
        );
      }

      case 'conclusion': {
        const p = block.props as ConclusionBlockProps;
        if (!conclusion || conclusion.trim() === '') return null;
        const bgClass = p.bgColor === 'slate' ? 'bg-slate-50' : p.bgColor === 'amber' ? 'bg-amber-50' : p.bgColor === 'white' ? 'bg-white' : '';
        return (
          <div className={`border border-slate-300 rounded p-2 mb-3 ${bgClass} text-[12px]`}>
            <span className="font-bold text-slate-800">{p.title || 'KẾT LUẬN & LỜI DẶN:'} </span>
            <span className="text-slate-800 leading-snug">{conclusion}</span>
          </div>
        );
      }

      case 'signature': {
        const p = block.props as SignatureBlockProps;
        return (
          <div className={`flex ${p.align === 'between' ? 'justify-between' : 'justify-end'} pt-1`}>
            {p.align === 'between' && (
              <div className="text-center min-w-[180px]">
                {p.showDate && <p className="text-[12px] text-slate-700 italic">Ngày {new Date().toLocaleDateString('vi-VN')}</p>}
                <p className="text-[13px] font-bold uppercase text-slate-900 my-0.5">NGƯỜI LÀM XÉT NGHIỆM</p>
                <div className="h-20" />
                <p className="text-[13px] font-semibold text-slate-800">KTV. Xét Nghiệm</p>
              </div>
            )}
            <div className="text-center min-w-[220px]">
              {p.showDate && <p className="text-[12px] text-slate-700 italic">Ngày {new Date().toLocaleDateString('vi-VN')}</p>}
              <p className="text-[13px] font-bold uppercase text-slate-900 tracking-wide my-0.5">
                {p.title || 'PHỤ TRÁCH CHUYÊN MÔN'}
              </p>
              {p.showStamp !== false ? (
                <div className="h-[68px] flex items-center justify-center my-0.5">
                  <img src={currentStamp} alt="Con Dấu & Chữ Ký" className="h-[68px] w-auto object-contain max-w-[120px]" />
                </div>
              ) : (
                <div className="h-16" />
              )}
              {p.showDoctorName !== false && (
                <p className="text-[13.5px] font-bold text-slate-900 uppercase">
                  {p.title?.toUpperCase().includes('CHỈ ĐỊNH')
                    ? (patient.doctor || doctorName || 'BS. Trần Hoài Long')
                    : (clinicInfo?.defaultDoctor || 'Nguyễn Thị Thành Trung')}
                </p>
              )}
            </div>
          </div>
        );
      }

      case 'custom_text': {
        const p = block.props as CustomTextBlockProps;
        const alignClass = p.align === 'center' ? 'text-center' : p.align === 'right' ? 'text-right' : 'text-left';
        return (
          <div className={`${alignClass} my-2 text-[12px] ${p.fontStyle === 'italic' ? 'italic' : p.fontStyle === 'bold' ? 'font-bold' : ''}`} style={{ color: p.textColor || '#475569' }}>
            {p.content}
          </div>
        );
      }

      case 'divider': {
        const p = block.props as DividerBlockProps;
        return (
          <hr
            style={{
              borderTopWidth: `${p.thickness || 1}px`,
              borderTopStyle: p.style || 'solid',
              borderTopColor: p.color || '#cbd5e1',
              marginTop: `${p.marginVertical || 8}px`,
              marginBottom: `${p.marginVertical || 8}px`
            }}
          />
        );
      }

      case 'spacer': {
        const p = block.props as SpacerBlockProps;
        return <div style={{ height: `${p.height || 16}px` }} />;
      }

      default:
        return null;
    }
  };

  // Chia các block thành các trang dựa trên `page_break`
  const pages = useMemo(() => {
    const pageList: TemplateBlock[][] = [[]];
    for (const b of sortedBlocks) {
      if (b.type === 'page_break') {
        if (isDesignMode) {
          // Trong design mode: giữ block page_break để có thể chọn, kéo thả, di chuyển
          pageList[pageList.length - 1].push(b);
        }
        pageList.push([]);
      } else {
        if (isDesignMode || isBlockVisible(b)) {
          pageList[pageList.length - 1].push(b);
        }
      }
    }
    return pageList.filter((p) => {
      if (isDesignMode) return p.length > 0;
      return p.some((b) => b.type !== 'page_break' && isBlockVisible(b));
    });
  }, [sortedBlocks, isDesignMode, isBlockVisible]);

  return (
    <div
      id={elementId}
      className="w-[210mm] max-w-[210mm] mx-auto bg-slate-200 print:bg-white print:m-0 print:p-0 space-y-4 print:space-y-0"
      onDragOver={isDesignMode ? (e) => e.preventDefault() : undefined}
      onDrop={isDesignMode && onDropBlock ? (e) => {
        e.preventDefault();
        const blockType = e.dataTransfer.getData('block_type');
        if (blockType) onDropBlock(blockType, undefined);
      } : undefined}
    >
      {pages.map((pageBlocks, pageIdx) => (
        <div
          key={pageIdx}
          data-page="true"
          className="report-page mx-auto bg-white text-slate-900 shadow-xl print:shadow-none print:m-0 print:mb-0 flex flex-col justify-between"
          style={{
            fontFamily:
              template.fontFamily === 'Arial'
                ? 'Arial, Helvetica, sans-serif'
                : template.fontFamily === 'Roboto'
                ? 'Roboto, sans-serif'
                : '"Times New Roman", Times, "Liberation Serif", serif',
            width: '210mm',
            minWidth: '210mm',
            maxWidth: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
            padding: `${template.paddingMm || 15}mm`
          }}
        >
          <div>
            {pageBlocks.map((block, blockIdx) => {
              const globalIdx = sortedBlocks.findIndex((b) => b.id === block.id);
              const isSelected = isDesignMode && selectedBlockId === block.id;

              // Điều kiện hiển thị thực tế
              const isVisibleOutside = isBlockVisible(block);
              if (!isDesignMode && !isVisibleOutside) {
                return null;
              }

              // Trạng thái mờ trong design mode: ẩn thủ công HOẶC không thỏa mãn điều kiện dữ liệu
              const dimmedInDesign = isDesignMode && (!block.visible || !isVisibleOutside);

              return (
                <div key={block.id}>
                  {/* Drop zone trước mỗi block (chỉ trong design mode) */}
                  {isDesignMode && onDropBlock && (
                    <div
                      className="drop-zone h-1 rounded transition-all duration-150 mx-1 mb-0.5 data-[over=true]:h-5 data-[over=true]:bg-sky-400/30 data-[over=true]:border-2 data-[over=true]:border-dashed data-[over=true]:border-sky-500"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).dataset.over = 'true';
                      }}
                      onDragLeave={(e) => {
                        (e.currentTarget as HTMLElement).dataset.over = 'false';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).dataset.over = 'false';
                        const blockType = e.dataTransfer.getData('block_type');
                        // insertBeforeBlockId = block.id (kéo thả trước block này)
                        if (blockType) {
                          const prevBlock = blockIdx > 0 ? pageBlocks[blockIdx - 1] : undefined;
                          onDropBlock(blockType, prevBlock?.id);
                        }
                      }}
                    />
                  )}

                  <div
                    onClick={() => isDesignMode && onSelectBlock?.(block.id)}
                    className={`relative transition-all group ${
                      isDesignMode
                        ? `cursor-pointer rounded border ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/20 ring-2 ring-sky-400/50 p-1 mb-1'
                              : 'border-transparent hover:border-slate-300 hover:bg-slate-50/50 p-1 mb-1'
                          } ${dimmedInDesign ? 'opacity-40 grayscale' : ''}`
                        : ''
                    }`}
                  >
                    {isDesignMode && (
                      <div
                        className={`absolute top-0 right-2 transform -translate-y-1/2 flex items-center space-x-1 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow-lg z-20 transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <span className="text-sky-400 font-bold">#{globalIdx + 1}</span>
                        <span className="font-semibold text-slate-200 max-w-[140px] truncate">{block.title || block.type}</span>
                        {!block.visible && <span className="text-amber-400 font-bold">(Ẩn)</span>}
                        {block.visible && block.visibilityCondition === 'never' && <span className="text-amber-400 font-bold">(Luôn ẩn)</span>}
                        {block.visible && !isVisibleOutside && (
                          <span className="text-orange-400 font-bold">(Thiếu dữ liệu)</span>
                        )}

                        {onReorderBlock && (
                          <div className="flex items-center space-x-0.5 ml-1 border-l border-slate-700 pl-1">
                            <button
                              type="button"
                              title="Di chuyển lên"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderBlock(block.id, 'up');
                              }}
                              disabled={globalIdx === 0}
                              className="p-0.5 hover:text-sky-400 disabled:opacity-30 disabled:hover:text-white cursor-pointer"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              title="Di chuyển xuống"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderBlock(block.id, 'down');
                              }}
                              disabled={globalIdx === sortedBlocks.length - 1}
                              className="p-0.5 hover:text-sky-400 disabled:opacity-30 disabled:hover:text-white cursor-pointer"
                            >
                              ↓
                            </button>
                          </div>
                        )}

                        {onRemoveBlock && (
                          <button
                            type="button"
                            title="Xóa khối này"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveBlock(block.id);
                            }}
                            className="ml-1 pl-1 border-l border-slate-700 text-red-400 hover:text-red-300 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                    {renderBlockContent(block)}
                  </div>
                </div>
              );
            })}

            {/* Drop zone cuối trang */}
            {isDesignMode && onDropBlock && (
              <div
                className="drop-zone h-1 rounded transition-all duration-150 mx-1 mt-0.5 data-[over=true]:h-5 data-[over=true]:bg-sky-400/30 data-[over=true]:border-2 data-[over=true]:border-dashed data-[over=true]:border-sky-500"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).dataset.over = 'true';
                }}
                onDragLeave={(e) => {
                  (e.currentTarget as HTMLElement).dataset.over = 'false';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).dataset.over = 'false';
                  const blockType = e.dataTransfer.getData('block_type');
                  // Append sau block cuối cùng của trang này
                  const lastBlock = pageBlocks[pageBlocks.length - 1];
                  if (blockType) onDropBlock(blockType, lastBlock?.id);
                }}
              />
            )}
          </div>

          {/* Footer Mặc Định */}
          <div className="mt-auto pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono">
            <span>
              HỆ THỐNG XÉT NGHIỆM GOLAB • {safeClinic.name} • HOTLINE: {safeClinic.phone}
            </span>
            <span className="font-bold text-sky-800">
              Trang {pageIdx + 1}/{pages.length}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(DynamicReportView);
