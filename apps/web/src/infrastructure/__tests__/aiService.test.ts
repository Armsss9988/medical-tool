import { describe, it, expect } from 'vitest';
import { executeAiSmartFill, testGeminiConnection, testOpenAiConnection } from '../aiService';
import { convertAiRowsToBatchImportRows } from '../aiTemplateMapper';
import { CatalogItem } from '@domain';

describe('AI Service & Template Mapper', () => {
  it('should reject empty API keys when testing connection', async () => {
    const geminiRes = await testGeminiConnection('');
    expect(geminiRes.success).toBe(false);
    expect(geminiRes.message).toContain('Vui lòng nhập Gemini API Key');

    const openAiRes = await testOpenAiConnection('');
    expect(openAiRes.success).toBe(false);
    expect(openAiRes.message).toContain('Vui lòng nhập OpenAI API Key');
  });

  it('should parse raw medical text using rule-based fallback when no API key is provided', async () => {
    const rawText = `Glucose máu: 5.4 mmol/L (3.9 - 6.4)
Ure máu: 4.8 mmol/L (2.5 - 7.5)
Creatinine: 85 umol/L (53 - 106)`;

    const result = await executeAiSmartFill(
      {
        targetTemplate: 'CATALOG_ITEMS',
        rawText
      },
      '' // No API key
    );

    expect(result.targetTemplate).toBe('CATALOG_ITEMS');
    expect(result.totalExtracted).toBe(3);
    expect(result.rows[0].data.code).toBe('GLU');
    expect(result.rows[1].data.code).toBe('URE');
    expect(result.rows[2].data.code).toBe('CRE');
  });

  it('should parse batch patient text and convert to BatchImportRow', async () => {
    const rawText = `NGUYEN VAN A, 1990, Nam, 0905123456, GLU: 5.2, URE: 4.5
TRAN THI B, 1985, Nữ, 0905987654, GLU: 6.8, WBC: 7.2`;

    const result = await executeAiSmartFill(
      {
        targetTemplate: 'BATCH_PATIENTS',
        rawText
      },
      ''
    );

    expect(result.totalExtracted).toBe(2);
    expect(result.rows[0].data.name).toContain('NGUYEN VAN A');
    expect(result.rows[1].data.name).toContain('TRAN THI B');

    const mockCatalog: CatalogItem[] = [
      { code: 'GLU', name: 'Glucose', category: 'Sinh Hóa', unit: 'mmol/L', price: 40000, refMin: 3.9, refMax: 6.4, refText: '3.9 - 6.4' },
      { code: 'URE', name: 'Ure', category: 'Sinh Hóa', unit: 'mmol/L', price: 40000, refMin: 2.5, refMax: 7.5, refText: '2.5 - 7.5' },
      { code: 'WBC', name: 'Bạch cầu', category: 'Huyết Học', unit: 'G/L', price: 40000, refMin: 4.0, refMax: 10.0, refText: '4.0 - 10.0' }
    ];

    const batchRows = convertAiRowsToBatchImportRows(result.rows, mockCatalog);
    expect(batchRows).toHaveLength(2);
    expect(batchRows[0].patient.name).toBe('NGUYEN VAN A');
    expect(batchRows[0].patient.gender).toBe('Nam');
    expect(batchRows[0].selectedTests.length).toBeGreaterThan(0);
  });
});
