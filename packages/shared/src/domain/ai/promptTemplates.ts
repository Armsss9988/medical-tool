import { AiTemplateTarget } from './aiTypes';

export const MEDICAL_CODE_ALIASES: Record<string, { code: string; defaultName: string; category: string; unit: string; refMin?: number; refMax?: number; refText?: string }> = {
  // Sinh Hóa
  'duong mau': { code: 'GLU', defaultName: 'Glucose máu', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 3.9, refMax: 6.4, refText: '3.9 - 6.4' },
  'glucose': { code: 'GLU', defaultName: 'Glucose máu', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 3.9, refMax: 6.4, refText: '3.9 - 6.4' },
  'duong huyet': { code: 'GLU', defaultName: 'Glucose máu', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 3.9, refMax: 6.4, refText: '3.9 - 6.4' },
  'ure': { code: 'URE', defaultName: 'Ure máu', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 2.5, refMax: 7.5, refText: '2.5 - 7.5' },
  'urea': { code: 'URE', defaultName: 'Ure máu', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 2.5, refMax: 7.5, refText: '2.5 - 7.5' },
  'creatinin': { code: 'CRE', defaultName: 'Creatinine máu', category: 'Sinh Hóa', unit: 'µmol/L', refMin: 53, refMax: 106, refText: '53 - 106' },
  'creatinine': { code: 'CRE', defaultName: 'Creatinine máu', category: 'Sinh Hóa', unit: 'µmol/L', refMin: 53, refMax: 106, refText: '53 - 106' },
  'ast': { code: 'AST', defaultName: 'AST (GOT)', category: 'Sinh Hóa', unit: 'U/L', refMin: 0, refMax: 37, refText: '< 37' },
  'got': { code: 'AST', defaultName: 'AST (GOT)', category: 'Sinh Hóa', unit: 'U/L', refMin: 0, refMax: 37, refText: '< 37' },
  'sgot': { code: 'AST', defaultName: 'AST (GOT)', category: 'Sinh Hóa', unit: 'U/L', refMin: 0, refMax: 37, refText: '< 37' },
  'alt': { code: 'ALT', defaultName: 'ALT (GPT)', category: 'Sinh Hóa', unit: 'U/L', refMin: 0, refMax: 41, refText: '< 41' },
  'gpt': { code: 'ALT', defaultName: 'ALT (GPT)', category: 'Sinh Hóa', unit: 'U/L', refMin: 0, refMax: 41, refText: '< 41' },
  'sgpt': { code: 'ALT', defaultName: 'ALT (GPT)', category: 'Sinh Hóa', unit: 'U/L', refMin: 0, refMax: 41, refText: '< 41' },
  'cholesterol': { code: 'CHO', defaultName: 'Cholesterol toàn phần', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 3.6, refMax: 5.2, refText: '3.6 - 5.2' },
  'triglyceride': { code: 'TRI', defaultName: 'Triglyceride', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 0.4, refMax: 1.7, refText: '0.4 - 1.7' },
  'acid uric': { code: 'URIC', defaultName: 'Acid Uric', category: 'Sinh Hóa', unit: 'µmol/L', refMin: 180, refMax: 420, refText: '180 - 420' },
  'hba1c': { code: 'HBA1C', defaultName: 'HbA1c', category: 'Sinh Hóa', unit: '%', refMin: 4.0, refMax: 6.0, refText: '4.0 - 6.0' },

  // Huyết Học
  'bach cau': { code: 'WBC', defaultName: 'Số lượng bạch cầu (WBC)', category: 'Huyết Học', unit: 'G/L', refMin: 4.0, refMax: 10.0, refText: '4.0 - 10.0' },
  'wbc': { code: 'WBC', defaultName: 'Số lượng bạch cầu (WBC)', category: 'Huyết Học', unit: 'G/L', refMin: 4.0, refMax: 10.0, refText: '4.0 - 10.0' },
  'hong cau': { code: 'RBC', defaultName: 'Số lượng hồng cầu (RBC)', category: 'Huyết Học', unit: 'T/L', refMin: 3.8, refMax: 5.3, refText: '3.8 - 5.3' },
  'rbc': { code: 'RBC', defaultName: 'Số lượng hồng cầu (RBC)', category: 'Huyết Học', unit: 'T/L', refMin: 3.8, refMax: 5.3, refText: '3.8 - 5.3' },
  'hgb': { code: 'HGB', defaultName: 'Huyết sắc tố (Hb/HGB)', category: 'Huyết Học', unit: 'g/L', refMin: 120, refMax: 165, refText: '120 - 165' },
  'tieu cau': { code: 'PLT', defaultName: 'Số lượng tiểu cầu (PLT)', category: 'Huyết Học', unit: 'G/L', refMin: 150, refMax: 450, refText: '150 - 450' },
  'plt': { code: 'PLT', defaultName: 'Số lượng tiểu cầu (PLT)', category: 'Huyết Học', unit: 'G/L', refMin: 150, refMax: 450, refText: '150 - 450' },

  // Nước Tiểu
  'bach cau nuoc tieu': { code: 'LEU_U', defaultName: 'Bạch cầu nước tiểu (LEU)', category: 'Nước Tiểu', unit: 'Leu/µL', refText: 'Âm tính (-)' },
  'protein nuoc tieu': { code: 'PRO_U', defaultName: 'Protein nước tiểu (PRO)', category: 'Nước Tiểu', unit: 'g/L', refText: 'Âm tính (-)' },
  'duong nuoc tieu': { code: 'GLU_U', defaultName: 'Glucose nước tiểu (GLU)', category: 'Nước Tiểu', unit: 'mmol/L', refText: 'Âm tính (-)' }
};

export function getSystemPromptForTarget(target: AiTemplateTarget): string {
  const baseInstruction = `Bạn là Chuyên Gia Trích Xuất Dữ Liệu Y Khoa (Medical Data & Template Extraction AI) cho hệ thống Quản lý Phòng Xét Nghiệm GoLab.
Nhiệm vụ của bạn là đọc nội dung văn bản, ảnh chụp, bảng biểu hoặc yêu cầu đầu vào từ người dùng, nhận diện và chuẩn hóa chính xác thành danh sách các mục dữ liệu JSON có cấu trúc để điền vào Mẫu Excel tương ứng.

Quy tắc y khoa bắt buộc:
1. Chuẩn hóa Mã Chỉ Số (Code): Viết hoa, ngắn gọn, chuẩn quốc tế (VD: GLU, URE, CRE, AST, ALT, WBC, RBC, HGB, PLT, d1, t3, e1).
2. Chuẩn hóa Giới Tính: Luôn trả về "Nam" hoặc "Nữ".
3. Chuẩn hóa Số Điện Thoại: Nếu là số Việt Nam 9 số, tự động thêm số 0 ở đầu (VD: 905123456 -> 0905123456).
4. Phân Biệt Kiểu Đánh Giá:
   - "range" (Khoảng số): Nếu có ngưỡng cận dưới (refMin) và/hoặc cận trên (refMax).
   - "scale" (Thang phân độ): Dành cho xét nghiệm dị nguyên (Allergen) hoặc định lượng kháng thể có cấp độ (Độ 0-6).
5. Luôn trả về dữ liệu thuần định dạng JSON hợp lệ (không kèm văn bản rác bên ngoài block markdown json).`;

  switch (target) {
    case 'CATALOG_ITEMS':
      return `${baseInstruction}
Bạn đang trích xuất dữ liệu cho MẪU CHỈ SỐ XÉT NGHIỆM.
Mỗi phần tử trong mảng phải có cấu trúc:
{
  "code": "Mã xét nghiệm (VD: GLU, URE, WBC)",
  "name": "Tên tiếng Việt chỉ số",
  "category": "Nhóm xét nghiệm (VD: Sinh Hóa, Huyết Học, Nước Tiểu, Dị Nguyên, Miễn Dịch)",
  "scientific": "Tên khoa học hoặc tiếng Anh nếu có",
  "unit": "Đơn vị đo (VD: mmol/L, G/L, IU/mL)",
  "evaluationType": "range" hoặc "scale",
  "refMin": số thực hoặc null,
  "refMax": số thực hoặc null,
  "scaleId": "scale_protia_91" hoặc "scale_allergen_44" (nếu là scale),
  "refText": "Text tham chiếu hiển thị (VD: 3.9 - 6.4 hoặc < 0.34 (Độ 0))",
  "price": số tiền VNĐ (mặc định 40000 nếu không có)
}`;

    case 'CATALOG_ITEM_EQUIPMENTS':
      return `${baseInstruction}
Bạn đang trích xuất dữ liệu cho MẪU CẤU HÌNH MÁY ĐO & NGƯỠNG ĐO.
Mỗi phần tử trong mảng:
{
  "catalogCode": "Mã chỉ số",
  "equipmentName": "Tên máy đo / thiết bị đo",
  "evaluationType": "range" hoặc "scale",
  "refMin": số thực hoặc null,
  "refMax": số thực hoặc null,
  "unit": "Đơn vị đo",
  "refText": "Text tham chiếu",
  "scaleId": string hoặc null,
  "isDefault": boolean (true nếu là máy đo chính/mặc định)
}`;

    case 'TEST_PACKAGES':
      return `${baseInstruction}
Bạn đang trích xuất dữ liệu cho MẪU GÓI XÉT NGHIỆM.
Mỗi phần tử trong mảng:
{
  "name": "Tên gói xét nghiệm",
  "defaultEquipmentName": "Tên máy đo chính của gói (nếu có)",
  "price": số tiền VNĐ,
  "itemCodes": ["MÃ_CHỈ_SỐ_1", "MÃ_CHỈ_SỐ_2", ...]
}`;

    case 'DOCTORS':
      return `${baseInstruction}
Bạn đang trích xuất dữ liệu cho MẪU BÁC SĨ & CHUYÊN GIA.
Mỗi phần tử:
{
  "name": "Họ và tên bác sĩ",
  "specialty": "Chuyên khoa / Chức vụ",
  "phone": "Số điện thoại chuẩn"
}`;

    case 'EQUIPMENTS':
      return `${baseInstruction}
Bạn đang trích xuất dữ liệu cho MẪU THIẾT BỊ & MÁY ĐO.
Mỗi phần tử:
{
  "name": "Tên máy đo",
  "code": "Mã máy đo (viết hoa, ngắn gọn)",
  "note": "Ghi chú / nguyên lý đo"
}`;

    case 'TEST_GROUPS':
      return `${baseInstruction}
Bạn đang trích xuất dữ liệu cho MẪU NHÓM XÉT NGHIỆM.
Mỗi phần tử:
{
  "name": "Tên nhóm xét nghiệm",
  "note": "Mô tả / ghi chú nhóm"
}`;

    case 'ALLERGEN_SCALES':
      return `${baseInstruction}
Bạn đang trích xuất dữ liệu cho MẪU THANG ĐO & PHÂN ĐỘ DỊ NGUYÊN.
Mỗi phần tử:
{
  "name": "Tên thang đo",
  "equipment": "Thiết bị đo áp dụng",
  "unit": "Đơn vị đo (mặc định: IU/ml)",
  "levels": [
    {
      "grade": 0,
      "minVal": 0,
      "maxVal": 0.34,
      "rangeText": "<0.34",
      "label": "Không phản ứng",
      "isPositive": false,
      "colorKey": "white"
    },
    ...
  ]
}`;

    case 'BATCH_PATIENTS':
      return `${baseInstruction}
Bạn đang trích xuất dữ liệu cho MẪU KHÁM ĐOÀN / BỆNH NHÂN & KẾT QUẢ HÀNG LOẠT.
Mỗi phần tử trong mảng:
{
  "code": "Mã bệnh nhân nếu có (VD: BN-001)",
  "name": "Họ và tên bệnh nhân (VIẾT HOA TOÀN BỘ)",
  "dob": "Năm sinh (VD: 1985) hoặc ngày sinh",
  "gender": "Nam" hoặc "Nữ",
  "phone": "Số điện thoại",
  "address": "Địa chỉ hoặc tên công ty / đoàn khám",
  "doctor": "Tên bác sĩ chỉ định nếu có",
  "diagnosis": "Chẩn đoán lâm sàng",
  "conclusion": "Kết luận hoặc lời dặn",
  "testResults": {
    "GLU": "5.4",
    "URE": "4.2",
    "WBC": "6.8",
    ...
  }
}`;
  }
}
