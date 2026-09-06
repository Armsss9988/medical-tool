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
