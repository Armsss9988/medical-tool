import { useState, useEffect, useMemo, memo } from 'react';
import golabLogo from '@assets/golabLogoDataUrl';
import doctorStamp from '@assets/doctorStampDataUrl';
import {
  Patient,
  SelectedTest,
  ClinicInfo,
  TestPackage,
  AllergenGradingScale,
  TestEquipment,
  CatalogItemEquipmentLink
} from '@domain/types';
import { isAllergenTest } from '@domain/allergenDetector';
import { AllergenReportDomainService } from '@domain/services/AllergenReportDomainService';
import { generateQrCodeDataUrl } from '@infra/qrService';
import AllergenCoverPage from './allergenReport/AllergenCoverPage';
import AllergenSummaryPage from './allergenReport/AllergenSummaryPage';
import AllergenDetailPage from './allergenReport/AllergenDetailPage';
import AllergenGuidancePage from './allergenReport/AllergenGuidancePage';

interface FullAllergenReportViewProps {
  elementId?: string;
  patient: Patient;
  allergenTests?: SelectedTest[];
  selectedTests?: SelectedTest[];
  currentDateStr?: string;
  doctorName?: string;
  conclusion?: string;
  qrCodeDataUrl?: string;
  qrCodeUrl?: string;
  clinicInfo?: ClinicInfo;
  testPackages?: TestPackage[];
  packagePrice?: number;
  allergenScales?: AllergenGradingScale[];
  equipments?: TestEquipment[];
  catalogItemEquipments?: CatalogItemEquipmentLink[];
}

function FullAllergenReportView({
  elementId = 'printable-allergen-report',
  patient,
  allergenTests: explicitAllergenTests,
  selectedTests = [],
  currentDateStr = new Date().toLocaleDateString('vi-VN'),
  doctorName,
  conclusion,
  qrCodeDataUrl,
  qrCodeUrl,
  clinicInfo = {
    name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
    address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
    phone: '032.855.3773',
    website: 'golab.com.vn',
    defaultDoctor: 'Nguyễn Thị Thành Trung'
  },
  testPackages = [],
  packagePrice: explicitPackagePrice,
  allergenScales = [],
  equipments = [],
  catalogItemEquipments = []
}: FullAllergenReportViewProps) {
  const allTests = useMemo(() => selectedTests || [], [selectedTests]);

  // Phân loại danh sách chỉ số: Chỉ số thường vs Chỉ số Dị nguyên
  const { regularTests, allergenTests } = useMemo(() => {
    if (explicitAllergenTests && explicitAllergenTests.length > 0) {
      return {
        regularTests: allTests.filter((t) => !isAllergenTest(t)),
        allergenTests: explicitAllergenTests
      };
    }

    const reg: SelectedTest[] = [];
    const alg: SelectedTest[] = [];
    for (const t of allTests) {
      if (isAllergenTest(t)) {
        alg.push(t);
      } else {
        reg.push(t);
      }
    }
    return { regularTests: reg, allergenTests: alg };
  }, [allTests, explicitAllergenTests]);

  const [autoQrCode, setAutoQrCode] = useState<string>(qrCodeDataUrl || '');

  useEffect(() => {
    if (qrCodeDataUrl) {
      setAutoQrCode(qrCodeDataUrl);
      return;
    }
    if (qrCodeUrl) {
      generateQrCodeDataUrl(qrCodeUrl).then((res) => {
        if (res) setAutoQrCode(res);
      });
      return;
    }
    const rawWebsite = typeof clinicInfo?.website === 'string' ? clinicInfo.website.trim() : '';
    const baseUrl = rawWebsite
      ? (rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`)
      : 'https://golab.com.vn';
    const code = patient.code || `BN-${Date.now()}`;
    const sample = patient.sampleCode || code;
    const lookupUrl = `${baseUrl}/tra-cuu?code=${encodeURIComponent(code)}&sample=${encodeURIComponent(sample)}`;

    generateQrCodeDataUrl(lookupUrl).then((res) => {
      if (res) setAutoQrCode(res);
    });
  }, [qrCodeDataUrl, qrCodeUrl, patient.code, patient.sampleCode, clinicInfo?.website]);

  const finalQrCode = qrCodeDataUrl || autoQrCode;
  const currentLogo =
    clinicInfo?.logoUrl &&
    typeof clinicInfo.logoUrl === 'string' &&
    clinicInfo.logoUrl.trim() !== '' &&
    clinicInfo.logoUrl !== 'null' &&
    clinicInfo.logoUrl !== 'undefined'
      ? clinicInfo.logoUrl
      : golabLogo;

  const currentStamp =
    clinicInfo?.stampUrl &&
    typeof clinicInfo.stampUrl === 'string' &&
    clinicInfo.stampUrl.trim() !== '' &&
    clinicInfo.stampUrl !== 'null' &&
    clinicInfo.stampUrl !== 'undefined'
      ? clinicInfo.stampUrl
      : doctorStamp;

  // Xây dựng DTO chuẩn từ Domain Service (Pure Business Logic)
  const reportDTO = useMemo(() => {
    return AllergenReportDomainService.buildReportDTO({
      tests: allergenTests,
      testPackages,
      packagePrice: explicitPackagePrice,
      customScales: allergenScales
    });
  }, [allergenTests, testPackages, explicitPackagePrice, allergenScales]);

  const matchedPackageName = useMemo(() => {
    const pkg = testPackages.find((p) => p.items?.some((i) => allergenTests.some((at) => at.code === i.code)));
    return pkg?.name;
  }, [testPackages, allergenTests]);

  return (
    <div id={elementId} className="w-[210mm] max-w-[210mm] mx-auto bg-slate-200 print:bg-white print:m-0 print:p-0 font-serif">
      {/* TRANG 1: PHIẾU KẾT QUẢ XÉT NGHIỆM (TRANG BÌA: BẢNG CHỈ SỐ THƯỜNG + TỔNG QUÁT GÓI DỊ NGUYÊN) */}
      <AllergenCoverPage
        patient={patient}
        clinicInfo={clinicInfo}
        currentDateStr={currentDateStr}
        doctorName={doctorName}
        conclusion={conclusion}
        finalQrCode={finalQrCode}
        currentLogo={currentLogo}
        currentStamp={currentStamp}
        totalCount={reportDTO.totalCount}
        packagePrice={reportDTO.packagePrice}
        packageName={matchedPackageName}
        totalPages={reportDTO.totalPages}
        regularTests={regularTests}
        equipments={equipments}
        catalogItemEquipments={catalogItemEquipments}
      />

      {/* TRANG 2: ĐỊNH LƯỢNG IgE ĐẶC HIỆU {N} DỊ NGUYÊN (TỔNG HỢP & DƯƠNG TÍNH) */}
      <AllergenSummaryPage
        patient={patient}
        clinicInfo={clinicInfo}
        currentLogo={currentLogo}
        totalCount={reportDTO.totalCount}
        positiveList={reportDTO.positiveList}
        appliedScales={reportDTO.appliedScales}
      />

      {/* CÁC TRANG 3 .. N: BẢNG CHI TIẾT KẾT QUẢ XÉT NGHIỆM {N} DỊ NGUYÊN */}
      {reportDTO.detailPages.map((pageItems, pageIdx) => (
        <AllergenDetailPage
          key={pageIdx}
          pageItems={pageItems}
          pageIdx={pageIdx}
          totalDetailPages={reportDTO.detailPages.length}
          totalCount={reportDTO.totalCount}
        />
      ))}

      {/* TRANG CUỐI: MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG */}
      <AllergenGuidancePage totalPages={reportDTO.totalPages} />
    </div>
  );
}

export default memo(FullAllergenReportView);
