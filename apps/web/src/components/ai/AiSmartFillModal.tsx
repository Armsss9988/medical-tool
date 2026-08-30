import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Sparkles, Upload, CheckCircle2,
  Download, ArrowRight, RefreshCw, CheckSquare, Square, Layers,
  Cpu, Activity, Users, Stethoscope, FlaskConical, Settings
} from 'lucide-react';
import {
  AiTemplateTarget,
  AiFillResult,
  CatalogItem,
  TestEquipment,
  TestGroup,
  Doctor,
  AllergenGradingScale,
  BatchImportRow,
  ToastType,
  CatalogItemEquipmentLink,
  TestPackage
} from '@domain';
import { executeAiSmartFill } from '@infra/aiService';
import { exportFilledTemplateExcel, convertAiRowsToBatchImportRows } from '@infra/aiTemplateMapper';

interface AiSmartFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: AiTemplateTarget;
  catalog: CatalogItem[];
  setCatalog?: (items: CatalogItem[]) => void;
  equipments: TestEquipment[];
  setEquipments?: (equipments: TestEquipment[]) => void;
  testGroups: TestGroup[];
  setTestGroups?: (groups: TestGroup[]) => void;
  testPackages: TestPackage[];
  setTestPackages?: (packages: TestPackage[]) => void;
  doctorsList: Doctor[];
  setDoctorsList?: (doctors: Doctor[]) => void;
  catalogItemEquipments: CatalogItemEquipmentLink[];
  setCatalogItemEquipments?: (links: CatalogItemEquipmentLink[]) => void;
  allergenScales: AllergenGradingScale[];
  setAllergenScales?: (scales: AllergenGradingScale[]) => void;
  onBatchImportToReports?: (rows: BatchImportRow[]) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export default function AiSmartFillModal({
  isOpen,
  onClose,
  initialTarget = 'CATALOG_ITEMS',
  catalog,
  setCatalog,
  equipments,
  setEquipments: _setEquipments,
  testGroups,
  setTestGroups: _setTestGroups,
  testPackages: _testPackages,
  setTestPackages: _setTestPackages,
  doctorsList,
  setDoctorsList,
  catalogItemEquipments: _catalogItemEquipments,
  setCatalogItemEquipments: _setCatalogItemEquipments,
  allergenScales,
  setAllergenScales: _setAllergenScales,
  onBatchImportToReports,
  showToast
}: AiSmartFillModalProps) {
  const [targetTemplate, setTargetTemplate] = useState<AiTemplateTarget>(initialTarget);
  const [step, setStep] = useState<'INPUT' | 'PROCESSING' | 'REVIEW'>('INPUT');
  const [rawText, setRawText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [aiResult, setAiResult] = useState<AiFillResult | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM_OR_LOW'>('ALL');
  const [apiKey, setApiKey] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('GOLAB_GEMINI_API_KEY') || '' : '';
  });
  const [openAiKey, setOpenAiKey] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('GOLAB_OPENAI_API_KEY') || '' : '';
  });
  const [aiProvider, setAiProvider] = useState<'GEMINI' | 'OPENAI'>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('GOLAB_AI_PROVIDER') as 'GEMINI' | 'OPENAI') || 'GEMINI' : 'GEMINI';
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const fileNameLower = file.name.toLowerCase();
    const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel');
    const isPdf = fileNameLower.endsWith('.pdf') || file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1];
        setImageBase64(base64);
        setImageMimeType(file.type);
        setRawText(`[Ảnh chụp phiếu xét nghiệm: ${file.name}]\nAI sẽ nhận diện hình ảnh và trích xuất bảng chỉ số.`);
        showToast(`Đã nhận diện ảnh: ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1];
        setImageBase64(base64);
        setImageMimeType('application/pdf');
        setRawText(`[Tài liệu PDF: ${file.name}]\nAI sẽ đọc và phân tích toàn bộ tài liệu PDF này.`);
        showToast(`Đã nhận diện file PDF: ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    } else if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const textParts: string[] = [];

          workbook.SheetNames.forEach((sheetName) => {
            if (sheetName.startsWith('_DataLookup')) return;
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) return;
            const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
            if (!jsonRows || jsonRows.length === 0) return;

            textParts.push(`\n=== BẢNG / SHEET: ${sheetName} ===`);
            jsonRows.slice(0, 100).forEach((row) => {
              if (row && Array.isArray(row) && row.some((c) => c !== null && c !== undefined && String(c).trim() !== '')) {
                textParts.push(row.map((c) => String(c ?? '').trim()).join(' | '));
              }
            });
          });

          const extractedText = textParts.join('\n').trim();
          setRawText(extractedText || `[File Excel: ${file.name} - Không có dữ liệu văn bản]`);
          showToast(`Đã trích xuất ${workbook.SheetNames.length} sheet từ file Excel: ${file.name}!`, 'success');
        } catch (err) {
          console.error('Lỗi đọc Excel:', err);
          showToast('Lỗi khi đọc file Excel', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Đọc dạng text cho các file txt, csv, json, v.v.
      const reader = new FileReader();
      reader.onload = () => {
        setRawText(reader.result as string);
        showToast(`Đã nạp nội dung từ file: ${file.name}`, 'info');
      };
      reader.readAsText(file);
    }
  };

  const handleStartAiFill = async () => {
    if (!rawText.trim() && !imageBase64) {
      showToast('Vui lòng dán văn bản hoặc tải lên file ảnh/dữ liệu cần trích xuất!', 'error');
      return;
    }

    setStep('PROCESSING');
    try {
      const res = await executeAiSmartFill(
        {
          targetTemplate,
          rawText,
          imageBase64,
          imageMimeType,
          fileName: uploadedFileName,
          contextData: {
            catalogCodes: catalog.map((c) => c.code),
            equipmentNames: equipments.map((e) => e.name),
            groupNames: testGroups.map((g) => g.name),
            doctorNames: doctorsList.map((d) => d.name),
            scaleNames: allergenScales.map((s) => s.name)
          }
        },
        apiKey
      );

      setAiResult(res);
      setStep('REVIEW');
      showToast(res.summary, 'success');
    } catch (err) {
      setStep('INPUT');
      showToast(err instanceof Error ? err.message : 'Lỗi khi gọi AI trích xuất', 'error');
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (!aiResult) return;
    setAiResult({
      ...aiResult,
      rows: aiResult.rows.map((r) => (r.id === id ? { ...r, isSelected: !r.isSelected } : r))
    });
  };

  const handleToggleSelectAll = () => {
    if (!aiResult) return;
    const allSelected = aiResult.rows.every((r) => r.isSelected);
    setAiResult({
      ...aiResult,
      rows: aiResult.rows.map((r) => ({ ...r, isSelected: !allSelected }))
    });
  };

  const handleExportExcel = async () => {
    if (!aiResult) return;
    try {
      showToast('Đang tạo và tải file Excel mẫu chuẩn...', 'info');
      await exportFilledTemplateExcel(targetTemplate, aiResult.rows, {
        catalog,
        equipments,
        testGroups,
        doctors: doctorsList,
        scales: allergenScales
      });
      showToast('Đã xuất file Excel mẫu điền sẵn thành công!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi xuất Excel', 'error');
    }
  };

  const handleDirectIngest = () => {
    if (!aiResult) return;
    const selectedRows = aiResult.rows.filter((r) => r.isSelected);
    if (selectedRows.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 dòng để nạp vào hệ thống!', 'error');
      return;
    }

    try {
      if (targetTemplate === 'CATALOG_ITEMS' && setCatalog) {
        const map = new Map(catalog.map((it) => [it.code.toUpperCase(), it]));
        let updatedCount = 0;
        let addedCount = 0;

        selectedRows.forEach((r) => {
          const d = r.data as Partial<CatalogItem>;
          const codeKey = (d.code || 'UNKNOWN').toUpperCase();
          const existing = map.get(codeKey);
          if (existing) {
            map.set(codeKey, {
              ...existing,
              ...d,
              category: d.category || existing.category,
              name: d.name || existing.name,
              scientific: d.scientific ?? existing.scientific,
              unit: d.unit || existing.unit,
              price: (d.price !== undefined && d.price > 0) ? d.price : existing.price,
              refText: d.refText || existing.refText,
              evaluationType: d.evaluationType || existing.evaluationType,
              scaleId: d.scaleId ?? existing.scaleId,
              refMin: d.refMin !== null && d.refMin !== undefined ? d.refMin : (d.evaluationType === 'scale' ? null : existing.refMin),
              refMax: d.refMax !== null && d.refMax !== undefined ? d.refMax : (d.evaluationType === 'scale' ? null : existing.refMax)
            });
            updatedCount++;
          } else {
            map.set(codeKey, {
              category: d.category || 'Sinh Hóa',
              code: codeKey,
              name: d.name || codeKey,
              scientific: d.scientific,
              unit: d.unit || '',
              evaluationType: d.evaluationType || 'range',
              refMin: d.refMin ?? null,
              refMax: d.refMax ?? null,
              scaleId: d.scaleId,
              refText: d.refText || '',
              price: d.price || 40000
            });
            addedCount++;
          }
        });

        setCatalog(Array.from(map.values()));
        showToast(`⚡ Đã nạp trực tiếp: Cập nhật ${updatedCount} chỉ số cũ, thêm mới ${addedCount} chỉ số!`, 'success');
        onClose();
      } else if (targetTemplate === 'BATCH_PATIENTS' && onBatchImportToReports) {
        const batchRows = convertAiRowsToBatchImportRows(selectedRows, catalog);
        onBatchImportToReports(batchRows);
        showToast(`⚡ Đã chuyển ${batchRows.length} bệnh nhân vào danh sách xuất kết quả!`, 'success');
        onClose();
      } else if (targetTemplate === 'DOCTORS' && setDoctorsList) {
        const map = new Map(doctorsList.map((d) => [d.name.toLowerCase(), d]));
        selectedRows.forEach((r) => {
          const d = r.data as Partial<Doctor>;
          const key = (d.name || '').toLowerCase();
          const existing = map.get(key);
          if (existing) {
            map.set(key, { ...existing, ...d, id: existing.id });
          } else {
            map.set(key, {
              id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: d.name || 'Bác Sĩ',
              specialty: d.specialty || 'Bác sĩ lâm sàng',
              phone: d.phone || ''
            });
          }
        });
        setDoctorsList(Array.from(map.values()));
        showToast(`⚡ Đã nạp thành công ${selectedRows.length} bác sĩ vào danh mục!`, 'success');
        onClose();
      } else {
        showToast('Tính năng nạp trực tiếp cho mẫu này đã sẵn sàng qua nút Xuất Excel Mẫu!', 'info');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi nạp dữ liệu', 'error');
    }
  };

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('GOLAB_AI_PROVIDER', aiProvider);
      localStorage.setItem('GOLAB_GEMINI_API_KEY', apiKey.trim());
      localStorage.setItem('GOLAB_OPENAI_API_KEY', openAiKey.trim());
      showToast(`Đã lưu cấu hình AI (${aiProvider === 'GEMINI' ? 'Google Gemini' : 'OpenAI'}) thành công!`, 'success');
      setShowSettings(false);
    }
  };

  const filteredRows = (aiResult?.rows || []).filter((r) => {
    if (confidenceFilter === 'HIGH') return r.confidence === 'HIGH';
    if (confidenceFilter === 'MEDIUM_OR_LOW') return r.confidence !== 'HIGH';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden border border-purple-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 p-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-wide">AI Smart Template Filler & Ingestion Engine</h3>
                <span className="bg-amber-400/30 text-amber-200 border border-amber-300/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Multi-Modal Y Khoa
                </span>
              </div>
              <p className="text-purple-200 text-xs mt-0.5">
                AI tự động trích xuất từ ảnh scan, PDF, Excel thô hoặc văn bản → Điền chính xác vào Mẫu Excel GoLab
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Cấu hình Gemini & OpenAI API Key"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Inline Settings */}
        {showSettings && (
          <div className="bg-purple-50 p-3 border-b border-purple-200 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Nhà Cung Cấp:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAiProvider('GEMINI')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    aiProvider === 'GEMINI' ? 'bg-purple-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('OPENAI')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    aiProvider === 'OPENAI' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
                  }`}
                >
                  OpenAI (ChatGPT)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-900 whitespace-nowrap min-w-[110px]">
                {aiProvider === 'GEMINI' ? 'Gemini API Key:' : 'OpenAI API Key:'}
              </span>
              <input
                type="password"
                value={aiProvider === 'GEMINI' ? apiKey : openAiKey}
                onChange={(e) => (aiProvider === 'GEMINI' ? setApiKey(e.target.value) : setOpenAiKey(e.target.value))}
                placeholder={aiProvider === 'GEMINI' ? 'AIzaSy... (Để trống để dùng Rule-Based)' : 'sk-proj-... (Để trống để dùng Rule-Based)'}
                className="flex-grow bg-white border border-purple-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-purple-600 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded cursor-pointer whitespace-nowrap"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        )}

        {/* Wizard Steps Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 ${step === 'INPUT' ? 'text-purple-700' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'INPUT' ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
              <span>Nạp Dữ Liệu & Chọn Mẫu</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-2 ${step === 'PROCESSING' ? 'text-purple-700' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'PROCESSING' ? 'bg-purple-700 text-white animate-spin' : 'bg-slate-200 text-slate-600'}`}>2</span>
              <span>AI Trích Xuất & Chuẩn Hóa</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-2 ${step === 'REVIEW' ? 'text-purple-700' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'REVIEW' ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
              <span>Duyệt & Xuất Mẫu</span>
            </div>
          </div>

          {step === 'REVIEW' && (
            <button
              type="button"
              onClick={() => setStep('INPUT')}
              className="flex items-center gap-1 text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Nạp dữ liệu khác</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-grow p-6 overflow-y-auto bg-slate-50/50">
          {step === 'INPUT' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Target Template Selector */}
              <div className="md:col-span-5 flex flex-col space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wide">
                    1. Chọn Mẫu Mục Tiêu Cần Điền (*)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'CATALOG_ITEMS', name: 'Mẫu 1: Chỉ Số Xét Nghiệm', icon: FlaskConical, desc: 'Tên, mã, đơn vị, khoảng tham chiếu, thang đo' },
                      { id: 'CATALOG_ITEM_EQUIPMENTS', name: 'Mẫu 2: Cấu Hình Thiết Bị', icon: Cpu, desc: 'Liên kết chỉ số với máy đo và ngưỡng đo riêng' },
                      { id: 'TEST_PACKAGES', name: 'Mẫu 3: Gói Xét Nghiệm', icon: Layers, desc: 'Tên gói, máy đo chính và danh sách chỉ số' },
                      { id: 'DOCTORS', name: 'Mẫu 4: Danh Sách Bác Sĩ', icon: Stethoscope, desc: 'Họ tên, chuyên khoa và số điện thoại chuẩn' },
                      { id: 'EQUIPMENTS', name: 'Mẫu 5: Thiết Bị & Máy Đo', icon: Cpu, desc: 'Tên máy, mã máy và nguyên lý đo' },
                      { id: 'TEST_GROUPS', name: 'Mẫu 6: Nhóm Xét Nghiệm', icon: Activity, desc: 'Tên nhóm và phân loại chuyên khoa' },
                      { id: 'ALLERGEN_SCALES', name: 'Mẫu 7: Thang Đo Phân Độ', icon: Layers, desc: 'Bậc phân độ (Độ 0-6), ngưỡng min/max và màu chỉ thị' },
                      { id: 'BATCH_PATIENTS', name: 'Mẫu 8: Khám Đoàn (Bệnh Nhân & KQ)', icon: Users, desc: 'Danh sách bệnh nhân và kết quả xét nghiệm hàng loạt' }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = targetTemplate === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setTargetTemplate(item.id as AiTemplateTarget)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-300/40 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className={`text-xs font-extrabold ${isSelected ? 'text-purple-950' : 'text-slate-800'}`}>
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Modal Data Input */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wide">
                    2. Nạp Dữ Liệu Nguồn Cần Trích Xuất (Ảnh / PDF / Excel / Văn Bản)
                  </label>

                  {/* File Drag & Drop Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-5 bg-purple-50/30 hover:bg-purple-50/60 transition text-center cursor-pointer mb-3"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.xlsx,.xls,.csv,.txt"
                      className="hidden"
                    />
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-purple-950">
                      Bấm vào đây để tải lên Ảnh Scan, PDF, File Excel thô, hoặc CSV
                    </p>
                    <p className="text-[11px] text-purple-600 mt-0.5">
                      {uploadedFileName ? `✓ Đã chọn file: ${uploadedFileName}` : 'Hỗ trợ PNG, JPG, PDF, XLSX, CSV, TXT'}
                    </p>
                  </div>

                  {/* Raw Text / Prompt Area */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-600">Hoặc dán trực tiếp văn bản / Prompt yêu cầu:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRawText('Glucose: 5.4 mmol/L (3.9 - 6.4)\nUre: 4.8 mmol/L (2.5 - 7.5)\nCreatinine: 88 umol/L (53 - 106)\nAST: 24 U/L (< 37)\nALT: 28 U/L (< 41)');
                          showToast('Đã nạp văn bản mẫu!', 'info');
                        }}
                        className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        Nạp mẫu thử nhanh
                      </button>
                    </div>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={8}
                      placeholder={`Ví dụ:\n- Dán kết quả phiếu xét nghiệm từ ảnh chụp OCR\n- Dán danh sách bệnh nhân khám đoàn: NGUYEN VAN A, 1990, Nam, GLU=5.2, WBC=6.5\n- Dán danh mục chỉ số hoặc yêu cầu: "Tạo gói xét nghiệm tổng quát gồm đường huyết, men gan, mỡ máu, chức năng thận"`}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600 shadow-2xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartAiFill}
                    className="w-full py-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 hover:from-purple-800 hover:to-sky-800 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300 animate-bounce" />
                    <span>Bắt Đầu Trích Xuất & Điền Vào Mẫu Ngay</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin" />
                <Sparkles className="w-8 h-8 text-purple-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-purple-950">AI Đang Phân Tích & Chuẩn Hóa Dữ Liệu Y Khoa...</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Đang đối chiếu từ vựng y tế, tra cứu mã chỉ số chuẩn quốc tế, nhận diện khoảng tham chiếu và phân loại theo schema của Mẫu GoLab.
                </p>
              </div>
            </div>
          )}

          {step === 'REVIEW' && aiResult && (
            <div className="flex flex-col space-y-4">
              {/* Summary Bar */}
              <div className="bg-white border border-purple-200 rounded-xl p-3 shadow-2xs flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">
                      {aiResult.summary}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tổng số: <strong className="text-purple-700">{aiResult.totalExtracted}</strong> dòng | Tin cậy cao: <strong className="text-emerald-700">{aiResult.highConfidenceCount}</strong> | Cần xem xét: <strong className="text-amber-700">{aiResult.mediumConfidenceCount + aiResult.lowConfidenceCount}</strong>
                    </p>
                  </div>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setConfidenceFilter('ALL')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${confidenceFilter === 'ALL' ? 'bg-white text-purple-900 shadow-2xs' : 'text-slate-600'}`}
                  >
                    Tất cả ({aiResult.totalExtracted})
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfidenceFilter('HIGH')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${confidenceFilter === 'HIGH' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'}`}
                  >
                    Tin cậy cao ({aiResult.highConfidenceCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfidenceFilter('MEDIUM_OR_LOW')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${confidenceFilter === 'MEDIUM_OR_LOW' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600'}`}
                  >
                    Cần duyệt ({aiResult.mediumConfidenceCount + aiResult.lowConfidenceCount})
                  </button>
                </div>
              </div>

              {/* Review Table Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[380px] overflow-y-auto bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <button type="button" onClick={handleToggleSelectAll} className="cursor-pointer">
                          {aiResult.rows.every((r) => r.isSelected) ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-2.5 w-10 text-center">STT</th>
                      <th className="p-2.5 w-24">ĐỘ TIN CẬY</th>
                      <th className="p-2.5 min-w-[200px]">DỮ LIỆU ĐÃ TRÍCH XUẤT ĐIỀN MẪU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredRows.map((row, idx) => (
                      <tr key={row.id} className={`hover:bg-slate-50/80 transition ${row.isSelected ? 'bg-purple-50/20' : 'opacity-60'}`}>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectRow(row.id)}
                            className="cursor-pointer text-slate-600 hover:text-purple-700"
                          >
                            {row.isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="p-2.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-2.5">
                          {row.confidence === 'HIGH' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                              🟢 100% Khớp
                            </span>
                          ) : row.confidence === 'MEDIUM' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                              🟡 Tương đối
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                              🔴 Cần xem
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans">
                          <div className="flex flex-wrap gap-2 text-xs">
                            {Object.entries(row.data).map(([key, val]) => {
                              if (val === null || val === undefined || val === '') return null;
                              const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                              return (
                                <span key={key} className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-800">
                                  <strong className="text-slate-500 font-mono">{key}:</strong> {displayVal}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons Footer */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-slate-600">
                  Đang chọn <strong>{aiResult.rows.filter((r) => r.isSelected).length}</strong> / {aiResult.rows.length} mục dữ liệu
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-purple-700" />
                    <span>📥 Xuất File Excel Mẫu Điền Sẵn</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectIngest}
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Nạp Trực Tiếp Vào Hệ Thống (Upsert)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
