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
import TemplateRuler from './TemplateRuler';

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
  showRuler?: boolean;
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
  showRuler = true,
  selectedBlockId,
  onSelectBlock,
  onRemoveBlock,
  onReorderBlock,
  onDropBlock
}: TemplateCanvasProps) {
  return (
    <div className="flex-1 bg-slate-950 overflow-auto p-4 md:p-8 flex justify-center items-start print:bg-transparent print:p-0 print:m-0 print:overflow-visible print:block">
      <div
        className={`relative transition-transform duration-150 origin-top print:shadow-none print:!transform-none print:overflow-visible ${
          showRuler && isDesignMode ? 'ml-6' : ''
        }`}
        style={{ transform: `scale(${zoomScale})` }}
      >
        {showRuler && isDesignMode && (
          <TemplateRuler
            paperSize={template.paperSize || 'A4'}
            orientation={template.orientation || 'portrait'}
            paddingMm={template.paddingMm || 15}
          />
        )}
        <div className="shadow-2xl rounded-sm overflow-hidden bg-white print:shadow-none print:overflow-visible">
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
    </div>
  );
}

export default memo(TemplateCanvas);

