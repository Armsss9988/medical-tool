import type {
  ClinicInfo,
  Patient,
  SelectedTest,
  TestPackage,
  TestEquipment,
  CatalogItemEquipmentLink,
  AllergenGradingScale,
  ReportTemplate
} from '@domain';
import type { PdfProgressInfo } from '@infra/pdfService';

export type { PdfProgressInfo };

export interface DynamicReportRenderProps {
  template: ReportTemplate;
  elementId: string;
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
}
