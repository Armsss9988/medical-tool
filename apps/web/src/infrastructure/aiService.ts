import {
  AiFillRequest,
  AiFillResult,
  ExtractedRowItem,
  getSystemPromptForTarget,
  MEDICAL_CODE_ALIASES
} from '@domain';

export type AiProviderType = 'GEMINI' | 'OPENAI';

/**
 * Kiểm tra kết nối tới Google Gemini API
 */
export async function testGeminiConnection(
  apiKey: string,
  model: string = 'gemini-2.5-flash'
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập Gemini API Key trước khi kiểm tra!' };
  }

  const startTime = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Trả lời đúng 1 chữ: OK' }]
          }
        ]
      })
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, message: `Lỗi kết nối Gemini API (HTTP ${response.status}): ${errText}`, latencyMs };
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return { success: true, message: `Kết nối thành công tới mô hình ${model} (Độ trễ: ${latencyMs}ms)!`, latencyMs };
    } else {
      return { success: false, message: 'Phản hồi không hợp lệ từ Gemini API.', latencyMs };
    }
  } catch (err) {
    return { success: false, message: `Lỗi mạng khi kết nối Gemini: ${err instanceof Error ? err.message : 'Không xác định'}` };
  }
}

/**
 * Kiểm tra kết nối tới OpenAI API (GPT-4o, GPT-4o-mini, v.v.)
 */
export async function testOpenAiConnection(
  apiKey: string,
  model: string = 'gpt-4o-mini'
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập OpenAI API Key trước khi kiểm tra!' };
  }

  const startTime = Date.now();
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Trả lời đúng 1 chữ: OK' }],
        max_tokens: 10
      })
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, message: `Lỗi kết nối OpenAI API (HTTP ${response.status}): ${errText}`, latencyMs };
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return { success: true, message: `Kết nối thành công tới mô hình ${model} (Độ trễ: ${latencyMs}ms)!`, latencyMs };
    } else {
      return { success: false, message: 'Phản hồi không hợp lệ từ OpenAI API.', latencyMs };
    }
  } catch (err) {
    return { success: false, message: `Lỗi mạng khi kết nối OpenAI: ${err instanceof Error ? err.message : 'Không xác định'}` };
  }
}

/**
 * Trích xuất khối JSON từ chuỗi phản hồi của LLM
 */
function extractJsonFromText(text: string): unknown {
  const clean = text.trim();
  // Tìm block ```json ... ```
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const targetStr = match ? match[1] : clean;

  try {
    return JSON.parse(targetStr);
  } catch {
    // Thử tìm mảng [...] hoặc object {...}
    const firstBracket = targetStr.indexOf('[');
    const lastBracket = targetStr.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(targetStr.slice(firstBracket, lastBracket + 1));
    }
    const firstBrace = targetStr.indexOf('{');
    const lastBrace = targetStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(targetStr.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Không thể phân tích dữ liệu JSON từ phản hồi của AI.');
  }
}

/**
 * Phân tích ngoại tuyến / Cục bộ dựa trên quy tắc khi chưa có hoặc lỗi API Key
 */
function fallbackRuleBasedParser(request: AiFillRequest): AiFillResult {
  const text = (request.rawText || '').trim();
  const rows: ExtractedRowItem[] = [];

  if (request.targetTemplate === 'CATALOG_ITEMS') {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      let matchedCode = `CODE_${idx + 1}`;
      let matchedName = line.split(/[:,-]/)[0].trim();
      let matchedCat = 'Sinh Hóa';
      let matchedUnit = 'mmol/L';
      let refMin: number | null = null;
      let refMax: number | null = null;
      let refText = '';

      for (const [kw, info] of Object.entries(MEDICAL_CODE_ALIASES)) {
        if (lower.includes(kw)) {
          matchedCode = info.code;
          matchedName = info.defaultName;
          matchedCat = info.category;
          matchedUnit = info.unit;
          refMin = info.refMin ?? null;
          refMax = info.refMax ?? null;
          refText = info.refText || '';
          break;
        }
      }

      const numMatches = line.match(/\d+(?:\.\d+)?/g);
      if (numMatches && numMatches.length >= 2 && refMin === null) {
        refMin = parseFloat(numMatches[0]);
        refMax = parseFloat(numMatches[1]);
        refText = `${refMin} - ${refMax}`;
      }

      rows.push({
        id: `row_${idx + 1}`,
        confidence: refMin !== null ? 'HIGH' : 'MEDIUM',
        isSelected: true,
        data: {
          code: matchedCode,
          name: matchedName,
          category: matchedCat,
          unit: matchedUnit,
          evaluationType: 'range',
          refMin,
          refMax,
          refText: refText || (refMin !== null && refMax !== null ? `${refMin} - ${refMax}` : ''),
          price: 40000
        }
      });
    });
  } else if (request.targetTemplate === 'BATCH_PATIENTS') {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    lines.forEach((line, idx) => {
      const parts = line.split(/[,\t;|]/).map((p) => p.trim());
      const name = parts[0] || `BỆNH NHÂN ${idx + 1}`;
      const dob = parts[1] || '1990';
      const gender = parts[2]?.toLowerCase().includes('nữ') ? 'Nữ' : 'Nam';
      const phone = parts[3] || '';

      const testResults: Record<string, string> = {};
      for (const [kw, info] of Object.entries(MEDICAL_CODE_ALIASES)) {
        if (line.toLowerCase().includes(kw)) {
          const m = line.match(new RegExp(`${kw}[:\\s=]+(\\d+(?:\\.\\d+)?)`, 'i'));
          if (m) {
            testResults[info.code] = m[1];
          }
        }
      }

      rows.push({
        id: `row_${idx + 1}`,
        confidence: Object.keys(testResults).length > 0 ? 'HIGH' : 'MEDIUM',
        isSelected: true,
        data: {
          code: `BN-${String(idx + 1).padStart(3, '0')}`,
          name: name.toUpperCase(),
          dob,
          gender,
          phone,
          address: 'GoLab Clinic',
          doctor: 'BS. Nguyễn Thị Thành Trung',
          diagnosis: 'Khám sức khỏe tổng quát',
          conclusion: 'Các chỉ số trong giới hạn bình thường',
          testResults
        }
      });
    });
  } else if (request.targetTemplate === 'DOCTORS') {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    lines.forEach((line, idx) => {
      const parts = line.split(/[-,\t;|]/).map((p) => p.trim());
      rows.push({
        id: `row_${idx + 1}`,
        confidence: 'HIGH',
        isSelected: true,
        data: {
          name: parts[0]?.startsWith('BS') ? parts[0] : `BS. ${parts[0] || 'Bác Sĩ ' + (idx + 1)}`,
          specialty: parts[1] || 'Bác sĩ lâm sàng',
          phone: parts[2] || '0905123456'
        }
      });
    });
  } else {
    rows.push({
      id: 'row_1',
      confidence: 'MEDIUM',
      isSelected: true,
      data: {
        name: text.slice(0, 50) || 'Dữ liệu mẫu',
        note: 'Trích xuất tự động'
      }
    });
  }

  return {
    targetTemplate: request.targetTemplate,
    summary: `Đã phân tích ${rows.length} mục dữ liệu thông qua bộ quy tắc y khoa tích hợp.`,
    totalExtracted: rows.length,
    highConfidenceCount: rows.filter((r) => r.confidence === 'HIGH').length,
    mediumConfidenceCount: rows.filter((r) => r.confidence === 'MEDIUM').length,
    lowConfidenceCount: rows.filter((r) => r.confidence === 'LOW').length,
    rows
  };
}

/**
 * Gửi yêu cầu trích xuất dữ liệu tới Google Gemini API
 */
async function callGeminiApi(
  request: AiFillRequest,
  apiKey: string,
  model: string,
  systemPrompt: string,
  contextNote: string
): Promise<string> {
  const userParts: unknown[] = [
    { text: `${systemPrompt}\n${contextNote}\n\nNội dung cần trích xuất và điền vào mẫu:\n${request.rawText || 'Hãy trích xuất từ file/ảnh đính kèm.'}` }
  ];

  if (request.imageBase64 && request.imageMimeType) {
    userParts.push({
      inlineData: {
        data: request.imageBase64,
        mimeType: request.imageMimeType
      }
    });
  }

  const requestBody = {
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Gửi yêu cầu trích xuất dữ liệu tới OpenAI API
 */
async function callOpenAiApi(
  request: AiFillRequest,
  apiKey: string,
  model: string,
  systemPrompt: string,
  contextNote: string
): Promise<string> {
  const contentArray: unknown[] = [
    {
      type: 'text',
      text: `${contextNote}\n\nNội dung cần trích xuất và điền vào mẫu:\n${request.rawText || 'Hãy trích xuất từ file/ảnh đính kèm.'}`
    }
  ];

  if (request.imageBase64) {
    const mime = request.imageMimeType || 'image/jpeg';
    contentArray.push({
      type: 'image_url',
      image_url: {
        url: `data:${mime};base64,${request.imageBase64}`
      }
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentArray }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Hàm điều phối chính để trích xuất dữ liệu mẫu AI
 */
export async function executeAiSmartFill(
  request: AiFillRequest,
  apiKeyOverride?: string
): Promise<AiFillResult> {
  const provider = (typeof window !== 'undefined' ? (localStorage.getItem('GOLAB_AI_PROVIDER') as AiProviderType) : null) || 'GEMINI';

  const geminiKey = apiKeyOverride ||
    (typeof window !== 'undefined' ? localStorage.getItem('GOLAB_GEMINI_API_KEY') : null) ||
    (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY ||
    '';

  const openAiKey = apiKeyOverride ||
    (typeof window !== 'undefined' ? localStorage.getItem('GOLAB_OPENAI_API_KEY') : null) ||
    (import.meta as unknown as { env?: { VITE_OPENAI_API_KEY?: string } }).env?.VITE_OPENAI_API_KEY ||
    '';

  const systemPrompt = getSystemPromptForTarget(request.targetTemplate);
  const contextNote = request.contextData
    ? `\nDanh mục hiện có trong hệ thống để tham chiếu:
- Mã chỉ số: ${(request.contextData.catalogCodes || []).slice(0, 50).join(', ')}
- Tên máy đo: ${(request.contextData.equipmentNames || []).join(', ')}
- Tên nhóm: ${(request.contextData.groupNames || []).join(', ')}
- Tên bác sĩ: ${(request.contextData.doctorNames || []).join(', ')}`
    : '';

  let candidateText = '';

  if (provider === 'OPENAI' && openAiKey) {
    const model = (typeof window !== 'undefined' ? localStorage.getItem('GOLAB_OPENAI_MODEL') : '') || 'gpt-4o-mini';
    try {
      candidateText = await callOpenAiApi(request, openAiKey, model, systemPrompt, contextNote);
    } catch (err) {
      console.warn(`[AiService] OpenAI gặp lỗi: ${err}. Chuyển sang Rule-Based Engine.`);
      return fallbackRuleBasedParser(request);
    }
  } else if (geminiKey) {
    const model = (typeof window !== 'undefined' ? localStorage.getItem('GOLAB_AI_MODEL') : '') || 'gemini-2.5-flash';
    try {
      candidateText = await callGeminiApi(request, geminiKey, model, systemPrompt, contextNote);
    } catch (err) {
      console.warn(`[AiService] Gemini gặp lỗi: ${err}. Chuyển sang Rule-Based Engine.`);
      return fallbackRuleBasedParser(request);
    }
  } else if (openAiKey) {
    const model = (typeof window !== 'undefined' ? localStorage.getItem('GOLAB_OPENAI_MODEL') : '') || 'gpt-4o-mini';
    try {
      candidateText = await callOpenAiApi(request, openAiKey, model, systemPrompt, contextNote);
    } catch (err) {
      console.warn(`[AiService] OpenAI gặp lỗi: ${err}. Chuyển sang Rule-Based Engine.`);
      return fallbackRuleBasedParser(request);
    }
  } else {
    console.warn('[AiService] Chưa cấu hình API Key (Gemini/OpenAI). Đang sử dụng Rule-Based Engine tích hợp.');
    return fallbackRuleBasedParser(request);
  }

  try {
    const parsedJson = extractJsonFromText(candidateText);
    const rawList: Record<string, unknown>[] = Array.isArray(parsedJson)
      ? parsedJson
      : Array.isArray((parsedJson as Record<string, unknown>).items)
      ? ((parsedJson as Record<string, unknown>).items as Record<string, unknown>[])
      : Array.isArray((parsedJson as Record<string, unknown>).data)
      ? ((parsedJson as Record<string, unknown>).data as Record<string, unknown>[])
      : [parsedJson as Record<string, unknown>];

    const rows: ExtractedRowItem[] = rawList.map((item, idx) => {
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
      const warnings: string[] = [];

      if (request.targetTemplate === 'CATALOG_ITEMS') {
        if (!item.code || !item.name) {
          confidence = 'LOW';
          warnings.push('Thiếu mã chỉ số hoặc tên chỉ số');
        }
      } else if (request.targetTemplate === 'BATCH_PATIENTS') {
        if (!item.name || !item.dob) {
          confidence = 'MEDIUM';
          warnings.push('Thiếu tên bệnh nhân hoặc năm sinh');
        }
      }

      return {
        id: `ai_row_${idx + 1}_${Date.now()}`,
        data: item,
        confidence,
        warnings: warnings.length > 0 ? warnings : undefined,
        isSelected: true
      };
    });

    return {
      targetTemplate: request.targetTemplate,
      summary: `AI đã trích xuất thành công ${rows.length} mục dữ liệu với độ chính xác cao.`,
      totalExtracted: rows.length,
      highConfidenceCount: rows.filter((r) => r.confidence === 'HIGH').length,
      mediumConfidenceCount: rows.filter((r) => r.confidence === 'MEDIUM').length,
      lowConfidenceCount: rows.filter((r) => r.confidence === 'LOW').length,
      rows,
      rawAiResponse: candidateText
    };
  } catch (err) {
    console.error('[AiService] Lỗi phân tích JSON kết quả AI:', err);
    return fallbackRuleBasedParser(request);
  }
}
