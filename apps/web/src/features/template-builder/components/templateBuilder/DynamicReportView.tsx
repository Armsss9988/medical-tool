import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import { generateQrCodeDataUrl, buildPortalUrl } from '@infra/qrService';
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
  DEFAULT_CLINIC_INFO,
  getSafeClinicInfo,
  sortTestsByPackageOrder,
  ReportPaginationEntry
} from '@domain';
import { AllergenReportDomainService, AllergenReportItemDTO } from '@domain/services/AllergenReportDomainService';
import { isAllergenTest } from '@domain/allergenDetector';

import { useDynamicReportPages } from './useDynamicReportPages';
import { DynamicReportHeaderBlock, DynamicReportTitleBlock } from './DynamicReportHeaderBlock';
import { DynamicReportPatientInfoBlock } from './DynamicReportPatientInfoBlock';
import { DynamicReportClinicalTableBlock } from './DynamicReportClinicalTableBlock';
import {
  DynamicReportAllergenSummaryBlock,
  DynamicReportAllergenHeaderBlock,
  DynamicReportAllergenTitleBlock,
  DynamicReportAllergenPatientSummaryBlock,
  DynamicReportAllergenPositiveTableBlock,
  DynamicReportAllergenScaleTableBlock,
  DynamicReportAllergenSymptomsBoxBlock,
  DynamicReportAllergenTigeNoteBlock,
  DynamicReportAllergenDetailTableBlock,
  DynamicReportAllergenPreventionGuideBlock,
  DynamicReportAllergenCoverSummaryBlock
} from './DynamicReportAllergenBlocks';
import {
  DynamicReportConclusionBlock,
  DynamicReportSignatureBlock,
  DynamicReportCustomTextBlock,
  DynamicReportDividerBlock,
  DynamicReportSpacerBlock,
  DynamicReportPageBreakBlock
} from './DynamicReportFooterBlocks';

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
    refText: '< 0.34',
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
    refText: '< 0.34',
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
    refText: '< 0.34',
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
    refText: '< 0.34',
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
    refText: '< 0.34',
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

export interface DynamicReportViewProps {
  template: ReportTemplate;
  patient?: Patient;
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
  patient: rawPatient,
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
  const patient: Patient = rawPatient || {
    code: 'BN-GOLAB',
    secretToken: '',
    name: 'Bệnh nhân mới',
    dob: '',
    gender: 'Nam',
    phone: '',
    address: '',
    diagnosis: '',
    sampleCode: 'BN-GOLAB',
    sampleStatus: 'Đạt',
    orderedAt: '',
    paidAt: undefined,
    receivedAt: '',
    returnedAt: ''
  };
  const currentLogo = clinicInfo?.logoUrl || golabLogo;
  const currentStamp = clinicInfo?.stampUrl || doctorStamp;

  const [autoQrCode, setAutoQrCode] = useState<string>('');

  useEffect(() => {
    if (qrCodeDataUrl) return;
    const code = patient.code || patient.sampleCode || 'BN-GOLAB';
    const portalUrl = buildPortalUrl(code, safeClinic.website);
    generateQrCodeDataUrl(portalUrl).then((res) => {
      if (res) setAutoQrCode(res);
    });
  }, [qrCodeDataUrl, patient.code, patient.sampleCode, safeClinic.website]);

  const finalQrCode = qrCodeDataUrl || autoQrCode;

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

  // Nhóm các chỉ số theo chuyên khoa (Category) đã sắp xếp theo order_index của package_items
  const groupedRegularTests = useMemo(() => {
    const sorted = sortTestsByPackageOrder(regularTests, testPackages);
    const map = new Map<string, SelectedTest[]>();
    for (const t of sorted) {
      const cat = (t.category && t.category.trim()) || 'Xét Nghiệm Khác';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return Array.from(map.entries());
  }, [regularTests, testPackages]);

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

  // Phân trang thông minh qua hook
  const renderedPages = useDynamicReportPages({
    sortedBlocks,
    isDesignMode,
    isBlockVisible,
    regularTests,
    allergenDTO,
    conclusion
  });

  const renderBlockContent = (
    block: TemplateBlock,
    tableChunkEntries?: ReadonlyArray<ReportPaginationEntry>,
    allergenTableChunkEntries?: AllergenReportItemDTO[],
    allergenChunkInfo?: { pageIdx: number; totalDetailPages: number; totalCount: number }
  ) => {
    switch (block.type) {
      case 'header':
        return (
          <DynamicReportHeaderBlock
            block={block}
            clinicInfo={clinicInfo}
            currentLogo={currentLogo}
            finalQrCode={finalQrCode}
          />
        );

      case 'title':
        return <DynamicReportTitleBlock block={block} />;

      case 'patient_info':
        return (
          <DynamicReportPatientInfoBlock
            block={block}
            patient={patient}
            doctorName={doctorName}
          />
        );

      case 'test_table':
        return (
          <DynamicReportClinicalTableBlock
            block={block}
            tableChunkEntries={tableChunkEntries}
            groupedRegularTests={groupedRegularTests}
            regularTests={regularTests}
            equipments={equipments}
            catalogItemEquipments={catalogItemEquipments}
          />
        );

      case 'allergen_summary':
        return <DynamicReportAllergenSummaryBlock block={block} allergenDTO={allergenDTO} />;

      case 'allergen_header':
        return <DynamicReportAllergenHeaderBlock block={block} clinicInfo={clinicInfo} currentLogo={currentLogo} />;

      case 'allergen_title':
        return <DynamicReportAllergenTitleBlock block={block} />;

      case 'allergen_patient_summary':
        return <DynamicReportAllergenPatientSummaryBlock block={block} patient={patient} />;

      case 'allergen_positive_table':
        return <DynamicReportAllergenPositiveTableBlock block={block} allergenDTO={allergenDTO} />;

      case 'allergen_scale_table':
        return (
          <DynamicReportAllergenScaleTableBlock
            block={block}
            allergenDTO={allergenDTO}
            allergenScales={allergenScales}
          />
        );

      case 'allergen_symptoms_box':
        return <DynamicReportAllergenSymptomsBoxBlock block={block} />;

      case 'allergen_tige_note':
        return <DynamicReportAllergenTigeNoteBlock block={block} />;

      case 'allergen_detail_table':
      case 'allergen_detail':
        return (
          <DynamicReportAllergenDetailTableBlock
            block={block}
            allergenDTO={allergenDTO}
            allergenTableChunkEntries={allergenTableChunkEntries}
            allergenChunkInfo={allergenChunkInfo}
          />
        );

      case 'allergen_prevention_guide':
      case 'allergen_scale':
        return <DynamicReportAllergenPreventionGuideBlock block={block} />;

      case 'allergen_cover_summary':
        return (
          <DynamicReportAllergenCoverSummaryBlock
            block={block}
            testPackages={testPackages}
            allergenTests={allergenTests}
            allergenDTO={allergenDTO}
          />
        );

      case 'page_break':
        return <DynamicReportPageBreakBlock block={block} />;

      case 'conclusion':
        return <DynamicReportConclusionBlock block={block} conclusion={conclusion} />;

      case 'signature':
        return (
          <DynamicReportSignatureBlock
            block={block}
            patient={patient}
            clinicInfo={clinicInfo}
            doctorName={doctorName}
            currentStamp={currentStamp}
          />
        );

      case 'custom_text':
        return <DynamicReportCustomTextBlock block={block} />;

      case 'divider':
        return <DynamicReportDividerBlock block={block} />;

      case 'spacer':
        return <DynamicReportSpacerBlock block={block} />;

      default:
        return null;
    }
  };

  const isA5 = template.paperSize === 'A5';
  const isLandscape = template.orientation === 'landscape';

  const pageWidth = isA5
    ? (isLandscape ? '210mm' : '148mm')
    : (isLandscape ? '297mm' : '210mm');

  const pageMinHeight = isA5
    ? (isLandscape ? '148mm' : '210mm')
    : (isLandscape ? '210mm' : '297mm');

  const resolvedFontFamily =
    template.fontFamily === 'Arial'
      ? 'Arial, Helvetica, sans-serif'
      : template.fontFamily === 'Roboto'
      ? 'Roboto, sans-serif'
      : template.fontFamily === 'Inter'
      ? 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      : '"Times New Roman", Times, "Liberation Serif", serif';

  return (
    <div
      id={elementId}
      className="mx-auto bg-slate-200 print:bg-white print:m-0 print:p-0 space-y-4 print:space-y-0"
      style={{ width: pageWidth, maxWidth: pageWidth }}
      onDragOver={isDesignMode ? (e) => e.preventDefault() : undefined}
      onDrop={isDesignMode && onDropBlock ? (e) => {
        e.preventDefault();
        const blockType = e.dataTransfer.getData('block_type');
        if (blockType) onDropBlock(blockType, undefined);
      } : undefined}
    >
      {renderedPages.map((renderedPage, pageIdx) => {
        const pageBlocks = renderedPage.blocks;
        return (
          <div
            key={pageIdx}
            data-page="true"
            className="report-page mx-auto bg-white text-slate-900 shadow-xl print:shadow-none print:m-0 print:mb-0 flex flex-col justify-between"
            style={{
              fontFamily: resolvedFontFamily,
              width: pageWidth,
              minWidth: pageWidth,
              maxWidth: pageWidth,
              minHeight: pageMinHeight,
              boxSizing: 'border-box',
              padding: `${template.paddingMm ?? (isA5 ? 8 : 15)}mm`
            }}
          >
            <div>
              {/* Mini Patient Header cho các trang kế tiếp (từ trang 2 trở đi của bảng dài) */}
              {renderedPage.isContinuation && (
                <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b border-slate-300 text-[11px] font-semibold text-slate-700 font-sans">
                  <div className="flex items-center space-x-3">
                    <span>Bệnh nhân: <strong className="text-slate-900 font-bold uppercase">{patient.name || '---'}</strong></span>
                    <span>Mã BN: <strong className="font-mono text-slate-900 font-bold">{patient.code || '---'}</strong></span>
                    {patient.dob && <span>Năm sinh: <strong>{patient.dob}</strong></span>}
                    {patient.gender && <span>Giới tính: <strong>{patient.gender}</strong></span>}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {safeClinic.name || 'HỆ THỐNG XÉT NGHIỆM GOLAB'}
                  </div>
                </div>
              )}
              {pageBlocks.map((block, blockIdx) => {
                const globalIdx = sortedBlocks.findIndex((b) => b.id === block.id);
                const isSelected = isDesignMode && selectedBlockId === block.id;

                // Điều kiện hiển thị thực tế
                const isVisibleOutside = isBlockVisible(block);
                if (!isDesignMode && !isVisibleOutside) {
                  return null;
                }

                // Ẩn conclusion hoặc signature nếu trang hiện tại chưa cho phép hiển thị khi phân trang
                if (block.type === 'conclusion' && renderedPage.showConclusionOverride === false) {
                  return null;
                }
                if (block.type === 'signature' && renderedPage.showSignatureOverride === false) {
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
                      {renderBlockContent(
                        block,
                        renderedPage.tableChunkEntries,
                        renderedPage.allergenTableChunkEntries,
                        renderedPage.allergenChunkInfo
                      )}
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
                Trang {pageIdx + 1}/{renderedPages.length}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(DynamicReportView);
