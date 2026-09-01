import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReportTemplate,
  TemplateBlock,
  TemplateBlockType,
  PRESET_TEMPLATES
} from '@domain/templateTypes';

const STORAGE_KEY_TEMPLATES = 'golab_report_templates_v2';
const STORAGE_KEY_ACTIVE = 'golab_active_template_id_v2';

export function useTemplateManager() {
  // Load templates from localStorage or fallback to PRESET_TEMPLATES
  const [templates, setTemplates] = useState<ReportTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (stored) {
        const parsed = JSON.parse(stored) as ReportTemplate[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep user custom templates (not presets) and merge with latest PRESET_TEMPLATES
          const customTemplates = parsed.filter((t) => !PRESET_TEMPLATES.some((p) => p.id === t.id));
          return [...PRESET_TEMPLATES, ...customTemplates];
        }
      }
    } catch (e) {
      console.warn('[useTemplateManager] Lỗi đọc templates từ localStorage:', e);
    }
    return PRESET_TEMPLATES;
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (stored) return stored;
    } catch {
      // ignore
    }
    return PRESET_TEMPLATES[0]?.id || 'tpl_standard_clinical';
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    } catch (e) {
      console.warn('[useTemplateManager] Lỗi lưu templates vào localStorage:', e);
    }
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeTemplateId);
    } catch {
      // ignore
    }
  }, [activeTemplateId]);

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === activeTemplateId) || templates[0] || PRESET_TEMPLATES[0];
  }, [templates, activeTemplateId]);

  const selectActiveTemplate = useCallback((id: string) => {
    setActiveTemplateId(id);
  }, []);

  const createTemplate = useCallback((base?: Partial<ReportTemplate>): ReportTemplate => {
    const newId = `tpl_custom_${Date.now()}`;
    const newTemplate: ReportTemplate = {
      id: newId,
      name: base?.name || 'Mẫu Phiếu Xét Nghiệm Mới',
      description: base?.description || 'Mẫu phiếu tùy chỉnh',
      category: base?.category || 'custom',
      isDefault: false,
      paperSize: base?.paperSize || 'A4',
      orientation: base?.orientation || 'portrait',
      fontFamily: base?.fontFamily || 'Times New Roman',
      primaryColor: base?.primaryColor || '#0284c7',
      paddingMm: base?.paddingMm || 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: base?.blocks ? JSON.parse(JSON.stringify(base.blocks)) : JSON.parse(JSON.stringify(PRESET_TEMPLATES[0].blocks))
    };

    setTemplates((prev) => [...prev, newTemplate]);
    setActiveTemplateId(newId);
    return newTemplate;
  }, []);

  const updateTemplate = useCallback((template: ReportTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t))
    );
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) return PRESET_TEMPLATES;
      return filtered;
    });
    setActiveTemplateId((prev) => (prev === id ? PRESET_TEMPLATES[0].id : prev));
  }, []);

  const duplicateTemplate = useCallback((id: string): ReportTemplate => {
    const target = templates.find((t) => t.id === id) || templates[0];
    const newId = `tpl_custom_${Date.now()}`;
    const cloned: ReportTemplate = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name} (Bản sao)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTemplates((prev) => [...prev, cloned]);
    setActiveTemplateId(newId);
    return cloned;
  }, [templates]);

  const setDefaultTemplate = useCallback((id: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        isDefault: t.id === id,
        updatedAt: new Date().toISOString()
      }))
    );
    setActiveTemplateId(id);
  }, []);

  const addBlockToTemplate = useCallback((templateId: string, blockType: TemplateBlockType, afterBlockId?: string) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;

        const maxOrder = t.blocks.reduce((acc, b) => Math.max(acc, b.order), 0);
        let defaultProps: TemplateBlock['props'] = {} as TemplateBlock['props'];
        let blockTitle = 'Khối Mới';

        switch (blockType) {
          case 'header':
            blockTitle = 'Header Phòng Khám';
            defaultProps = { showLogo: true, showClinicName: true, showAddress: true, showContact: true, showQr: true, clinicNameSize: 'md', borderBottom: true };
            break;
          case 'title':
            blockTitle = 'Tiêu Đề Phiếu';
            defaultProps = { text: 'PHIẾU KẾT QUẢ XÉT NGHIỆM', fontSize: 'xl', textColor: '#0f172a', uppercase: true, align: 'center' };
            break;
          case 'patient_info':
            blockTitle = 'Thông Tin Bệnh Nhân';
            defaultProps = { layout: 'table_12_fields', highlightName: true, highlightSampleCode: true, showSampleStatus: true, showDoctor: true, showReceivedAt: true, showReturnedAt: true };
            break;
          case 'test_table':
            blockTitle = 'Bảng Chỉ Số Xét Nghiệm';
            defaultProps = { columns: { stt: true, name: true, result: true, refRange: true, unit: true, equipment: true, price: false, note: false }, groupByCategory: true, highlightAbnormal: true, fontSize: 'sm', density: 'normal' };
            break;
          case 'allergen_summary':
            blockTitle = 'Tổng Hợp Dị Nguyên Dương Tính';
            defaultProps = { title: 'TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH', showScaleBadges: true, showRoute: true, showConcentration: true, showNegativeNotice: true };
            break;
          case 'allergen_detail':
            blockTitle = 'Bảng Chi Tiết Dị Nguyên';
            defaultProps = { itemsPerPage: 13, showNormalRef: true, showGradeBadge: true };
            break;
          case 'allergen_scale':
            blockTitle = 'Thang Đo & Hướng Dẫn';
            defaultProps = { showGuidelines: true };
            break;
          case 'allergen_header':
            blockTitle = 'Header Báo Cáo Dị Nguyên';
            defaultProps = { showLogo: true, showClinicName: true, showAddress: true, showContact: true, badgeText: 'BÁO CÁO DỊ NGUYÊN', badgeColor: '#dc2626' };
            break;
          case 'allergen_title':
            blockTitle = 'Tiêu Đề Định Lượng IgE';
            defaultProps = { text: 'KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU', subtitle: '(Tổng hợp các dị nguyên dương tính & nồng độ IgE toàn phần)', fontSize: 'lg', textColor: '#0f172a', subtitleColor: '#b91c1c', align: 'center' };
            break;
          case 'allergen_patient_summary':
            blockTitle = 'Thanh Bệnh Nhân Tóm Tắt';
            defaultProps = { showName: true, showDob: true, showGender: true, sampleType: 'Huyết thanh', highlightName: true };
            break;
          case 'allergen_positive_table':
            blockTitle = 'Bảng Dị Nguyên Dương Tính';
            defaultProps = { title: 'TỔNG HỢP CÁC DỊ NGUYÊN DƯƠNG TÍNH', showScientific: true, showCode: true, showGradeBadge: true, showTIgE: true, emptyNotice: 'Chưa phát hiện dị nguyên dương tính', footnote: '(Chi tiết vui lòng xem trang sau)' };
            break;
          case 'allergen_scale_table':
            blockTitle = 'Bảng Diễn Giải Thang Đo (+)';
            defaultProps = { title: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH', showBadges: true, showConcentration: true, showInterpretation: true };
            break;
          case 'allergen_symptoms_box':
            blockTitle = 'Khung Triệu Chứng Dị Ứng';
            defaultProps = { title: 'MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG', showSkin: true, showRespiratory: true, showDigestive: true, showSevere: true, warningText: 'Nếu xuất hiện các triệu chứng trên sau tiếp xúc cần tư vấn bác sỹ ngay.' };
            break;
          case 'allergen_tige_note':
            blockTitle = 'Ghi Chú Nồng Độ TIgE';
            defaultProps = { title: 'Ghi chú: Tổng nồng độ IgE (TIgE)', normalRange: '<15,0', interpretation: 'Mức bình thường — Không tính Độ (+), chỉ có Kết Quả (IU/ml)' };
            break;
          case 'allergen_detail_table':
            blockTitle = 'Bảng Chi Tiết {N} Dị Nguyên';
            defaultProps = { title: 'CHI TIẾT KẾT QUẢ XÉT NGHIỆM DỊ NGUYÊN', itemsPerPage: 13, columns: { tt: true, code: true, name: true, allergenName: true, route: true, normalRef: true, result: true, grade: true, note: true }, highlightPositive: true };
            break;
          case 'allergen_prevention_guide':
            blockTitle = '5 Lưu Ý Phòng Ngừa Dị Ứng';
            defaultProps = { title: 'MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG', showItems: { item1: true, item2: true, item3: true, item4: true, item5: true } };
            break;
          case 'allergen_cover_summary':
            blockTitle = 'Tóm Tắt Gói Trên Trang Bìa';
            defaultProps = { showPackageName: true, showItemCount: true, showPackagePrice: true, boxTitle: 'TỔNG QUAN GÓI TẦM SOÁT DỊ NGUYÊN' };
            break;
          case 'page_break':
            blockTitle = 'Ngắt Trang In A4';
            defaultProps = { label: 'Ngắt Sang Trang In Mới' };
            break;
          case 'conclusion':
            blockTitle = 'Kết Luận & Lời Dặn';
            defaultProps = { title: 'KẾT LUẬN & LỜI DẶN:', showBorder: true, bgColor: 'slate', fontSize: 'sm' };
            break;
          case 'signature':
            blockTitle = 'Chữ Ký Bác Sĩ';
            defaultProps = { showDate: true, title: 'PHỤ TRÁCH CHUYÊN MÔN', showStamp: true, showDoctorName: true, align: 'right' };
            break;
          case 'custom_text':
            blockTitle = 'Văn Bản Tự Do';
            defaultProps = { content: 'Ghi chú thêm: Kết quả chỉ có giá trị tại thời điểm xét nghiệm.', fontSize: 'sm', fontStyle: 'italic', align: 'left', textColor: '#475569' };
            break;
          case 'divider':
            blockTitle = 'Đường Kẻ Phân Cách';
            defaultProps = { thickness: 1, style: 'solid', color: '#cbd5e1', marginVertical: 8 };
            break;
          case 'spacer':
            blockTitle = 'Khoảng Đệm Trống';
            defaultProps = { height: 16 };
            break;
        }

        const newBlock: TemplateBlock = {
          id: `block_${blockType}_${Date.now()}`,
          type: blockType,
          title: blockTitle,
          visible: true,
          order: maxOrder + 1,
          props: defaultProps
        };

        // Nếu có afterBlockId: chèn ngay sau block đó bằng cách reorder
        if (afterBlockId) {
          const sortedBlocks = [...t.blocks].sort((a, b) => a.order - b.order);
          const insertAfterIdx = sortedBlocks.findIndex((b) => b.id === afterBlockId);
          if (insertAfterIdx !== -1) {
            // Chèn newBlock ở vị trí insertAfterIdx + 1 trong mảng sắp xếp
            sortedBlocks.splice(insertAfterIdx + 1, 0, newBlock);
            // Gán lại order tuần tự
            const reordered = sortedBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
            return {
              ...t,
              blocks: reordered,
              updatedAt: new Date().toISOString()
            };
          }
        }

        return {
          ...t,
          blocks: [...t.blocks, newBlock],
          updatedAt: new Date().toISOString()
        };
      })
    );
  }, []);

  const removeBlockFromTemplate = useCallback((templateId: string, blockId: string) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          blocks: t.blocks.filter((b) => b.id !== blockId),
          updatedAt: new Date().toISOString()
        };
      })
    );
  }, []);

  const reorderBlockInTemplate = useCallback(
    (templateId: string, blockId: string, direction: 'up' | 'down') => {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id !== templateId) return t;
          const blocks = [...t.blocks].sort((a, b) => a.order - b.order);
          const index = blocks.findIndex((b) => b.id === blockId);
          if (index === -1) return t;

          const targetIndex = direction === 'up' ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= blocks.length) return t;

          // Swap orders
          const tempOrder = blocks[index].order;
          blocks[index].order = blocks[targetIndex].order;
          blocks[targetIndex].order = tempOrder;

          return {
            ...t,
            blocks: [...blocks],
            updatedAt: new Date().toISOString()
          };
        })
      );
    },
    []
  );

  const updateBlockInTemplate = useCallback(
    (templateId: string, blockId: string, updates: Partial<TemplateBlock>) => {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id !== templateId) return t;
          return {
            ...t,
            blocks: t.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
            updatedAt: new Date().toISOString()
          };
        })
      );
    },
    []
  );

  const exportTemplateJson = useCallback((template: ReportTemplate) => {
    const jsonStr = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${template.id}_${template.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const importTemplateJson = useCallback((jsonStr: string): ReportTemplate | null => {
    try {
      const parsed = JSON.parse(jsonStr) as ReportTemplate;
      if (!parsed || !parsed.name || !Array.isArray(parsed.blocks)) {
        throw new Error('Định dạng template JSON không hợp lệ');
      }

      const imported: ReportTemplate = {
        ...parsed,
        id: `tpl_imported_${Date.now()}`,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTemplates((prev) => [...prev, imported]);
      setActiveTemplateId(imported.id);
      return imported;
    } catch (err) {
      console.error('[useTemplateManager] Lỗi nạp JSON template:', err);
      return null;
    }
  }, []);

  const resetToPresets = useCallback(() => {
    setTemplates(PRESET_TEMPLATES);
    setActiveTemplateId(PRESET_TEMPLATES[0].id);
  }, []);

  return {
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
  };
}
