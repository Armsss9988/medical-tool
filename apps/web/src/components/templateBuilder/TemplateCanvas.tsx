import { memo } from 'react';
import {
  Patient,
  SelectedTest,
  ClinicInfo,
  TestPackage,
  AllergenGradingScale,
  TestEquipment,
  CatalogItemEquipmentLink,
  ReportTemplate
} from '@domain';
import DynamicReportView from './DynamicReportView';

interface TemplateCanvasProps {
  template: ReportTemplate;
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
  zoomScale: number;
  isDesignMode: boolean;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onRemoveBlock?: (blockId: string) => void;
  onReorderBlock?: (blockId: string, direction: 'up' | 'down') => void;
  onDropBlock?: (blockType: string, afterBlockId?: string) => void;
}

function TemplateCanvas({
  template,
  patient,
  selectedTests,
  clinicInfo,
  doctorName,
  conclusion,
  qrCodeDataUrl,
  testPackages,
  equipments,
  catalogItemEquipments,
  allergenScales,
  zoomScale,
  isDesignMode,
  selectedBlockId,
  onSelectBlock,
  onRemoveBlock,
  onReorderBlock,
  onDropBlock
}: TemplateCanvasProps) {
  return (
    <div className="flex-1 bg-slate-950 overflow-auto p-4 md:p-8 flex justify-center items-start">
      <div
        className="shadow-2xl rounded-sm overflow-hidden bg-white transition-transform duration-150 origin-top"
        style={{ transform: `scale(${zoomScale})` }}
      >
        <DynamicReportView
          template={template}
          patient={patient}
          selectedTests={selectedTests}
          clinicInfo={clinicInfo}
          doctorName={doctorName}
          conclusion={conclusion}
          qrCodeDataUrl={qrCodeDataUrl}
          testPackages={testPackages}
          equipments={equipments}
          catalogItemEquipments={catalogItemEquipments}
          allergenScales={allergenScales}
          isDesignMode={isDesignMode}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
          onRemoveBlock={onRemoveBlock}
          onReorderBlock={onReorderBlock}
          onDropBlock={onDropBlock}
          elementId="builder-dynamic-report"
        />
      </div>
    </div>
  );
}

export default memo(TemplateCanvas);

