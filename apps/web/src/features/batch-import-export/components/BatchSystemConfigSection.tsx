import React from 'react';
import {
  FlaskConical, Settings2, Package, Stethoscope, Cpu, FolderTree, Activity,
  FileText, Download, Upload, Sparkles, Layers
} from 'lucide-react';
import {
  CatalogItem, TestGroup, TestEquipment, TestPackage, Doctor,
  CatalogItemEquipmentLink, AllergenGradingScale, MedicalReport, Invoice,
  AiTemplateTarget, ToastType
} from '@domain';
import {
  exportCatalogItemsTemplate,
  exportCatalogItemEquipmentsTemplate,
  exportTestPackagesTemplate,
  exportDoctorsTemplate,
  exportEquipmentsTemplate,
  exportTestGroupsTemplate,
  exportScalesTemplate,
  exportReportsExcel,
  exportRevenueExcel
} from '@infra/excelService';

interface BatchSystemConfigSectionProps {
  catalog: CatalogItem[];
  testGroups: TestGroup[];
  catalogGroupFilter: string;
  setCatalogGroupFilter: (val: string) => void;
  handleImportCatalog: (e: React.ChangeEvent<HTMLInputElement>) => void;
  equipments: TestEquipment[];
  catalogItemEquipments: CatalogItemEquipmentLink[];
  equipmentLinkFilter: string;
  setEquipmentLinkFilter: (val: string) => void;
  handleImportEquipmentLinks: (e: React.ChangeEvent<HTMLInputElement>) => void;
  testPackages: TestPackage[];
  packageExportFilter: string;
  setPackageExportFilter: (val: string) => void;
  handleImportPackages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  doctorsList: Doctor[];
  handleImportDoctors: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImportEquipments: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImportGroups: (e: React.ChangeEvent<HTMLInputElement>) => void;
  allergenScales: AllergenGradingScale[];
  handleImportScales: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reports: MedicalReport[];
  invoices: Invoice[];
  onOpenAiSmartFill?: (target?: AiTemplateTarget) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export const BatchSystemConfigSection: React.FC<BatchSystemConfigSectionProps> = ({
  catalog,
  testGroups,
  catalogGroupFilter,
  setCatalogGroupFilter,
  handleImportCatalog,
  equipments,
  catalogItemEquipments,
  equipmentLinkFilter,
  setEquipmentLinkFilter,
  handleImportEquipmentLinks,
  testPackages,
  packageExportFilter,
  setPackageExportFilter,
  handleImportPackages,
  doctorsList,
  handleImportDoctors,
  handleImportEquipments,
  handleImportGroups,
  allergenScales,
  handleImportScales,
  reports,
  invoices,
  onOpenAiSmartFill,
  showToast
}) => {
  return (
    <>
      {/* ── SECTION 2: TOÀN BỘ FILE MẪU & DANH MỤC RELATIONAL EXCEL ── */}
      <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-sky-400" />
              <span>2. Trung Tâm Quản Lý File Mẫu Excel Danh Mục &amp; Cấu Hình Thiết Bị</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Mỗi bảng có 1 file template riêng biệt, tự động nhúng Sheet tra cứu <code className="text-sky-300 font-mono">_DataLookup</code> và khóa chuẩn Dropdown chọn từ cơ sở dữ liệu
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAiSmartFill?.('CATALOG_ITEMS')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer border border-purple-400/40"
            title="Mở Trợ lý AI Điền File Mẫu Y Khoa Tự Động"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>✨ AI Điền Mẫu Tự Động</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 1: Chỉ Số Xét Nghiệm */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-sky-400" />
                  Chỉ Số Xét Nghiệm
                </span>
                <span className="font-mono text-[10px] text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded">
                  {catalog.length} chỉ số
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px]">
                <FolderTree className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-400 font-bold shrink-0">Nhóm:</span>
                <select
                  value={catalogGroupFilter}
                  onChange={(e) => setCatalogGroupFilter(e.target.value)}
                  className="bg-transparent text-sky-300 font-bold focus:outline-none cursor-pointer w-full truncate"
                  title="Chọn nhóm xét nghiệm để tạo mẫu hoặc xuất dữ liệu"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">-- Tất Cả Nhóm ({catalog.length}) --</option>
                  {testGroups.map((g) => {
                    const count = catalog.filter((it) => it.category.toLowerCase() === g.name.toLowerCase()).length;
                    return (
                      <option key={g.id} value={g.name} className="bg-slate-900 text-white">
                        {g.name} ({count} chỉ số)
                      </option>
                    );
                  })}
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                Template mẫu chứa 3-5 dòng hướng dẫn kèm Sheet <code className="text-sky-300 font-mono">_DataLookup</code> tra cứu nhóm &amp; kiểu đánh giá.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  exportCatalogItemsTemplate(testGroups, catalog, { isSampleOnly: true, filterCategory: catalogGroupFilter });
                  const name = catalogGroupFilter === 'all' ? 'Tổng Hợp' : `Nhóm ${catalogGroupFilter}`;
                  showToast(`Đã tải file Template mẫu chỉ số [${name}]!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Tải template mẫu trống"
              >
                <Download className="w-3 h-3" />
                <span>Mẫu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportCatalogItemsTemplate(testGroups, catalog, { isSampleOnly: false, filterCategory: catalogGroupFilter });
                  const name = catalogGroupFilter === 'all' ? 'Tất cả' : `Nhóm ${catalogGroupFilter}`;
                  showToast(`Đã xuất dữ liệu chỉ số [${name}] ra Excel!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Xuất toàn bộ dữ liệu chỉ số"
              >
                <Download className="w-3 h-3" />
                <span>Data</span>
              </button>

              <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Nhập</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportCatalog} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => onOpenAiSmartFill?.('CATALOG_ITEMS')}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                title="AI tự động trích xuất và điền vào mẫu chỉ số"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI</span>
              </button>
            </div>
          </div>

          {/* Card 2: Cấu Hình Thiết Bị & Ngưỡng Đo */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-indigo-400" />
                  Cấu Hình Máy &amp; Ngưỡng
                </span>
                <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
                  {catalogItemEquipments.length} liên kết
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-400 font-bold shrink-0">Máy:</span>
                <select
                  value={equipmentLinkFilter}
                  onChange={(e) => setEquipmentLinkFilter(e.target.value)}
                  className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer w-full truncate"
                  title="Chọn thiết bị để lọc mẫu hoặc xuất dữ liệu"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">-- Tất Cả Máy ({equipments.length}) --</option>
                  {equipments.map((eq) => {
                    const count = catalogItemEquipments.filter((l) => l.equipmentId === eq.id).length;
                    return (
                      <option key={eq.id} value={eq.id} className="bg-slate-900 text-white">
                        {eq.name} ({count} liên kết)
                      </option>
                    );
                  })}
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                Gán ngưỡng tham chiếu riêng biệt (min/max, đơn vị, thang đo) tương ứng theo từng máy đo.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  exportCatalogItemEquipmentsTemplate(catalog, equipments, catalogItemEquipments, { isSampleOnly: true, filterEquipmentId: equipmentLinkFilter });
                  const eqName = equipmentLinkFilter === 'all' ? 'Tổng Hợp' : (equipments.find((e) => e.id === equipmentLinkFilter)?.name || equipmentLinkFilter);
                  showToast(`Đã tải file Template mẫu Cấu hình máy [${eqName}]!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Tải template mẫu trống"
              >
                <Download className="w-3 h-3" />
                <span>Mẫu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportCatalogItemEquipmentsTemplate(catalog, equipments, catalogItemEquipments, { isSampleOnly: false, filterEquipmentId: equipmentLinkFilter });
                  const eqName = equipmentLinkFilter === 'all' ? 'Tất cả' : (equipments.find((e) => e.id === equipmentLinkFilter)?.name || equipmentLinkFilter);
                  showToast(`Đã xuất dữ liệu liên kết máy [${eqName}] ra Excel!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Xuất toàn bộ cấu hình máy"
              >
                <Download className="w-3 h-3" />
                <span>Data</span>
              </button>

              <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Nhập</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportEquipmentLinks} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => onOpenAiSmartFill?.('CATALOG_ITEM_EQUIPMENTS')}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                title="AI tự động trích xuất và điền vào mẫu cấu hình máy"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI</span>
              </button>
            </div>
          </div>

          {/* Card 3: Gói Xét Nghiệm */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-400" />
                  Gói Xét Nghiệm
                </span>
                <span className="font-mono text-[10px] text-purple-400 bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 rounded">
                  {testPackages.length} gói
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-400 font-bold shrink-0">Gói:</span>
                <select
                  value={packageExportFilter}
                  onChange={(e) => setPackageExportFilter(e.target.value)}
                  className="bg-transparent text-purple-300 font-bold focus:outline-none cursor-pointer w-full truncate"
                  title="Chọn gói xét nghiệm để tải mẫu hoặc xuất dữ liệu"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">-- Tất Cả Gói ({testPackages.length}) --</option>
                  {testPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id} className="bg-slate-900 text-white">
                      {pkg.name} ({pkg.items?.length || 0} chỉ số)
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                Định nghĩa các combo xét nghiệm thường quy, khám tổng quát, gan mật, thận, lipid...
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  exportTestPackagesTemplate(catalog, equipments, testPackages, { isSampleOnly: true, filterPackageId: packageExportFilter });
                  const pkgName = packageExportFilter === 'all' ? 'Tổng Hợp' : (testPackages.find((p) => p.id === packageExportFilter)?.name || packageExportFilter);
                  showToast(`Đã tải file Template mẫu Gói khám [${pkgName}]!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Tải template mẫu trống"
              >
                <Download className="w-3 h-3" />
                <span>Mẫu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportTestPackagesTemplate(catalog, equipments, testPackages, { isSampleOnly: false, filterPackageId: packageExportFilter });
                  const pkgName = packageExportFilter === 'all' ? 'Tất cả' : (testPackages.find((p) => p.id === packageExportFilter)?.name || packageExportFilter);
                  showToast(`Đã xuất dữ liệu gói xét nghiệm [${pkgName}] ra Excel!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Xuất toàn bộ gói xét nghiệm"
              >
                <Download className="w-3 h-3" />
                <span>Data</span>
              </button>

              <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Nhập</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportPackages} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => onOpenAiSmartFill?.('TEST_PACKAGES')}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                title="AI tự động trích xuất và điền vào mẫu gói"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI</span>
              </button>
            </div>
          </div>

          {/* Card 4: Bác Sĩ Chỉ Định */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  Bác Sĩ Chỉ Định
                </span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                  {doctorsList.length} bác sĩ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Quản lý danh sách bác sĩ, số điện thoại, bệnh viện, khoa phòng và tỷ lệ chiết khấu/hoa hồng.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  exportDoctorsTemplate(doctorsList, true);
                  showToast('Đã tải file Template mẫu Bác sĩ về máy!', 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Tải template mẫu Bác sĩ kèm hướng dẫn"
              >
                <Download className="w-3 h-3" />
                <span>Mẫu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportDoctorsTemplate(doctorsList, false);
                  showToast(`Đã xuất ${doctorsList.length} bác sĩ từ cơ sở dữ liệu ra Excel!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Xuất danh sách bác sĩ thực tế trong DB"
              >
                <Download className="w-3 h-3" />
                <span>Data</span>
              </button>

              <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Nhập</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportDoctors} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => onOpenAiSmartFill?.('DOCTORS')}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                title="AI tự động trích xuất và điền vào mẫu bác sĩ"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI</span>
              </button>
            </div>
          </div>

          {/* Card 5: Thiết Bị Máy Đo */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  Thiết Bị Máy Đo
                </span>
                <span className="font-mono text-[10px] text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded">
                  {equipments.length} máy
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Quản lý các máy phân tích tự động: Huyết học, Sinh hóa, Miễn dịch, Nước tiểu, Test nhanh...
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  exportEquipmentsTemplate(equipments, true);
                  showToast('Đã tải file Template mẫu Thiết bị máy đo về máy!', 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Tải template mẫu Thiết bị kèm hướng dẫn"
              >
                <Download className="w-3 h-3" />
                <span>Mẫu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportEquipmentsTemplate(equipments, false);
                  showToast(`Đã xuất ${equipments.length} thiết bị từ cơ sở dữ liệu ra Excel!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Xuất danh sách thiết bị máy đo thực tế trong DB"
              >
                <Download className="w-3 h-3" />
                <span>Data</span>
              </button>

              <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Nhập</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportEquipments} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => onOpenAiSmartFill?.('EQUIPMENTS')}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                title="AI tự động trích xuất và điền vào mẫu thiết bị"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI</span>
              </button>
            </div>
          </div>

          {/* Card 6: Nhóm Xét Nghiệm */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4 text-amber-400" />
                  Nhóm Xét Nghiệm
                </span>
                <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                  {testGroups.length} nhóm
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Quản lý danh mục các chuyên khoa: Sinh hóa, Huyết học, Nước tiểu, Dị nguyên, Miễn dịch...
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  exportTestGroupsTemplate(testGroups, true);
                  showToast('Đã tải file Template mẫu Nhóm xét nghiệm về máy!', 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Tải template mẫu Nhóm xét nghiệm kèm hướng dẫn"
              >
                <Download className="w-3 h-3" />
                <span>Mẫu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportTestGroupsTemplate(testGroups, false);
                  showToast(`Đã xuất ${testGroups.length} nhóm xét nghiệm từ cơ sở dữ liệu ra Excel!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Xuất danh mục nhóm xét nghiệm thực tế trong DB"
              >
                <Download className="w-3 h-3" />
                <span>Data</span>
              </button>

              <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Nhập</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportGroups} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => onOpenAiSmartFill?.('TEST_GROUPS')}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                title="AI tự động trích xuất và điền vào mẫu nhóm"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI</span>
              </button>
            </div>
          </div>

          {/* Card 7: Thang Đo & Phân Độ */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Thang Đo Phân Độ
                </span>
                <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                  {allergenScales.length} thang đo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Quản lý các mức phân độ bán định lượng (0-6, âm/dương tính, ngưỡng min-max, màu chỉ thị).
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  exportScalesTemplate(allergenScales, true);
                  showToast('Đã tải file Template mẫu Thang đo về máy!', 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Tải template mẫu Thang đo phân độ kèm hướng dẫn"
              >
                <Download className="w-3 h-3" />
                <span>Mẫu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportScalesTemplate(allergenScales, false);
                  showToast(`Đã xuất ${allergenScales.length} thang đo từ cơ sở dữ liệu ra Excel!`, 'success');
                }}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                title="Xuất danh mục thang đo thực tế trong DB"
              >
                <Download className="w-3 h-3" />
                <span>Data</span>
              </button>

              <label className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] border border-slate-700 transition cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Nhập</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportScales} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => onOpenAiSmartFill?.('ALLERGEN_SCALES')}
                className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold text-[10px] transition cursor-pointer border border-purple-500/30"
                title="AI tự động trích xuất và điền vào mẫu thang đo"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: XUẤT SỔ SÁCH & BÁO CÁO DOANH THU ── */}
      <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
        <div className="border-b border-slate-700/60 pb-3">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>3. Xuất Sổ Sách Xét Nghiệm &amp; Báo Cáo Doanh Thu Ra Excel</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Trích xuất toàn bộ dữ liệu lịch sử phiếu xét nghiệm và hóa đơn tài chính sang định dạng bảng tính Excel
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-white">Sổ Lưu Phiếu Xét Nghiệm</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Tổng hợp {reports.length} ca khám, kết quả, bác sĩ, link PDF
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                exportReportsExcel(reports);
                showToast('Đã xuất toàn bộ Sổ lưu xét nghiệm ra file Excel!', 'success');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition cursor-pointer active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Sổ Lưu</span>
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-white">Báo Cáo Doanh Thu Theo Bác Sĩ</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Tổng hợp {invoices.length} hóa đơn thu phí và thống kê doanh số
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const doctorStats = doctorsList.map((d) => {
                  const docInvoices = invoices.filter((i) => i.doctorName === d.name);
                  const totalRev = docInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
                  const allTotal = invoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
                  return {
                    doctor: d,
                    totalRevenue: totalRev,
                    invoiceCount: docInvoices.length,
                    percentage: allTotal > 0 ? (totalRev / allTotal) * 100 : 0
                  };
                });
                exportRevenueExcel(invoices, doctorStats);
                showToast('Đã xuất Báo cáo doanh thu ra file Excel!', 'success');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs transition cursor-pointer active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Doanh Thu</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
