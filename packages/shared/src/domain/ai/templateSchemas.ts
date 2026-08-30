import { z } from 'zod';

export const aiCatalogItemSchema = z.object({
  code: z.string().min(1, 'Mã chỉ số là bắt buộc').describe('Mã code xét nghiệm, viết hoa, không dấu (VD: GLU, URE, WBC, d1)'),
  name: z.string().min(1, 'Tên chỉ số là bắt buộc').describe('Tên tiếng Việt của xét nghiệm (VD: Glucose máu, Ure máu)'),
  category: z.string().default('Sinh Hóa').describe('Tên nhóm xét nghiệm (VD: Sinh Hóa, Huyết Học, Nước Tiểu, Dị Nguyên)'),
  scientific: z.string().optional().describe('Tên khoa học hoặc tiếng Anh / Allergen'),
  unit: z.string().default('').describe('Đơn vị đo (VD: mmol/L, G/L, IU/mL)'),
  evaluationType: z.enum(['range', 'scale']).default('range').describe('Kiểu đánh giá: range (khoảng số) hoặc scale (thang phân độ)'),
  refMin: z.number().nullable().optional().describe('Ngưỡng tối thiểu (chỉ khi evaluationType là range)'),
  refMax: z.number().nullable().optional().describe('Ngưỡng tối đa (chỉ khi evaluationType là range)'),
  scaleId: z.string().nullable().optional().describe('Mã thang đo (VD: scale_protia_91, scale_allergen_44 nếu evaluationType là scale)'),
  refText: z.string().default('').describe('Chuỗi text tham chiếu (VD: 3.9 - 6.4 hoặc < 0.34 (Độ 0))'),
  price: z.number().default(0).describe('Đơn giá xét nghiệm (VNĐ)')
});

export const aiCatalogItemEquipmentSchema = z.object({
  catalogCode: z.string().min(1).describe('Mã chỉ số xét nghiệm liên kết'),
  equipmentName: z.string().min(1).describe('Tên máy đo / thiết bị đo áp dụng'),
  evaluationType: z.enum(['range', 'scale']).default('range'),
  refMin: z.number().nullable().optional(),
  refMax: z.number().nullable().optional(),
  unit: z.string().default(''),
  refText: z.string().default(''),
  scaleId: z.string().nullable().optional(),
  isDefault: z.boolean().default(false).describe('Đặt làm máy đo mặc định cho chỉ số này hay không')
});

export const aiTestPackageSchema = z.object({
  name: z.string().min(1).describe('Tên gói xét nghiệm (VD: Gói Khám Sức Khỏe Tổng Quát Cơ Bản)'),
  defaultEquipmentName: z.string().nullable().optional().describe('Tên máy đo chính của gói (nếu có)'),
  price: z.number().default(0).describe('Đơn giá của gói (VNĐ)'),
  itemCodes: z.array(z.string()).min(1).describe('Danh sách mã các chỉ số thành phần thuộc gói (VD: ["GLU", "URE", "WBC"])')
});

export const aiDoctorSchema = z.object({
  name: z.string().min(1).describe('Họ và tên bác sĩ (VD: BS. Nguyễn Thị Thành Trung)'),
  specialty: z.string().default('Bác sĩ xét nghiệm').describe('Chuyên khoa hoặc chức vụ'),
  phone: z.string().default('').describe('Số điện thoại liên hệ (chuẩn 10 số)')
});

export const aiEquipmentSchema = z.object({
  name: z.string().min(1).describe('Tên thiết bị / máy đo xét nghiệm (VD: Máy Sinh Hóa Tự Động MS-360)'),
  code: z.string().optional().describe('Mã máy đo ngắn gọn (VD: MS-360, COBAS-E801)'),
  note: z.string().optional().describe('Ghi chú hoặc nguyên lý đo của máy')
});

export const aiTestGroupSchema = z.object({
  name: z.string().min(1).describe('Tên nhóm xét nghiệm (VD: Sinh Hóa, Huyết Học, Miễn Dịch)'),
  note: z.string().optional().describe('Mô tả hoặc ghi chú của nhóm')
});

export const aiScaleLevelSchema = z.object({
  grade: z.number().describe('Bậc phân độ (VD: 0, 1, 2, 3, 4, 5, 6)'),
  minVal: z.number().describe('Ngưỡng cận dưới'),
  maxVal: z.number().nullable().optional().describe('Ngưỡng cận trên (null nếu >)'),
  rangeText: z.string().describe('Khoảng giá trị text (VD: <0.34, 0.35 - 0.69, >100)'),
  label: z.string().describe('Diễn giải lâm sàng (VD: Không phản ứng, Dương tính yếu, Rất mạnh)'),
  isPositive: z.boolean().default(false).describe('Trạng thái kết quả: true = Dương tính, false = Âm tính'),
  colorKey: z.string().default('white').describe('Mã màu chỉ thị (white, amber-light, amber, red-light, red, red-bold, red-extreme)')
});

export const aiScaleSchema = z.object({
  name: z.string().min(1).describe('Tên thang đo phân độ (VD: DIỄN GIẢI ĐỘ DƯƠNG TÍNH PROTIA 91)'),
  equipment: z.string().optional().describe('Thiết bị áp dụng thang đo này'),
  unit: z.string().default('IU/ml').describe('Đơn vị đo của thang'),
  levels: z.array(aiScaleLevelSchema).min(1).describe('Danh sách các bậc phân độ theo thứ tự tăng dần')
});

export const aiBatchPatientSchema = z.object({
  code: z.string().optional().describe('Mã bệnh nhân hoặc mã bệnh phẩm (VD: BN-2026-001)'),
  name: z.string().min(1).describe('Họ và tên bệnh nhân (VD: NGUYỄN VĂN A)'),
  dob: z.string().describe('Năm sinh hoặc ngày sinh (VD: 1990 hoặc 15/08/1990)'),
  gender: z.enum(['Nam', 'Nữ']).default('Nam').describe('Giới tính: Nam hoặc Nữ'),
  phone: z.string().default('').describe('Số điện thoại'),
  address: z.string().default('').describe('Địa chỉ / Công ty'),
  doctor: z.string().default('').describe('Bác sĩ chỉ định'),
  diagnosis: z.string().default('Khám sức khỏe định kỳ').describe('Chẩn đoán lâm sàng'),
  conclusion: z.string().default('').describe('Kết luận / Lời dặn của bác sĩ'),
  testResults: z.record(z.string(), z.string()).default({}).describe('Bản đồ kết quả xét nghiệm { "Mã_Chỉ_Số": "Giá_Trị" } (VD: { "GLU": "5.4", "URE": "4.2", "WBC": "6.8" })')
});
