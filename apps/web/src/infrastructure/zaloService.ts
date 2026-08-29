import { ZaloZnsConfig, ZaloSendResult, MedicalReport, ClinicInfo } from '@domain/types';

export const DEFAULT_ZALO_CONFIG: ZaloZnsConfig = {
  enabled: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_ENABLED === 'true') || false,
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_APP_ID) || '',
  secretKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_SECRET_KEY) || '',
  oaId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_OA_ID) || '',
  accessToken: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_ACCESS_TOKEN) || '',
  refreshToken: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_REFRESH_TOKEN) || '',
  templateId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_TEMPLATE_ID) || '',
  autoSendOnExport: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_AUTO_SEND === 'true') || false,
  proxyUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZALO_PROXY_URL) || ''
};

/**
 * Chuẩn hóa số điện thoại Việt Nam sang định dạng quốc tế 84xxxxxxxxx cho Zalo ZNS
 */
export function formatZaloPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '84' + digits.slice(1);
  }
  if (digits.startsWith('84')) {
    return digits;
  }
  return '84' + digits;
}

/**
 * Chuẩn hóa số điện thoại cho đường dẫn zalo.me (giữ 098... hoặc 84...)
 */
export function formatZaloMePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84')) {
    return '0' + digits.slice(2);
  }
  return digits;
}

/**
 * Tạo nội dung tin nhắn Zalo chuẩn y khoa gửi bệnh nhân
 */
export function generateZaloTextMessage(
  report: MedicalReport,
  clinicInfo: ClinicInfo,
  customNote?: string
): string {
  const dateStr = new Date(report.createdAt).toLocaleDateString('vi-VN');
  const timeStr = new Date(report.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const clinicName = (clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB').toUpperCase();
  const hotline = clinicInfo.phone || '032.855.3773';
  const website = clinicInfo.website || 'golab.com.vn';
  const address = clinicInfo.address || 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị';
  const doctor = report.doctorName || report.patient?.doctor || 'BS. Trần Hoài Long';

  let msg = `🏥 *${clinicName}*\n`;
  msg += `*PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM Y KHOA*\n\n`;
  msg += `Kính gửi: *${(report.patient.name || 'Quý Khách').toUpperCase()}*\n`;
  msg += `• Mã bệnh nhân: *${report.code}*\n`;
  if (report.sampleCode && report.sampleCode !== report.code) {
    msg += `• Số bệnh phẩm: *${report.sampleCode}*\n`;
  }
  msg += `• Thời gian trả KQ: ${timeStr} ngày ${dateStr}\n`;
  msg += `• Bác sĩ chỉ định: ${doctor}\n`;
  msg += `• Loại phiếu: ${report.isAllergen ? 'Panel Dị Nguyên 91 Chỉ Số' : `${report.testCount || report.selectedTests.length} Chỉ số xét nghiệm`}\n`;

  if (report.conclusion) {
    msg += `• *Kết luận của Bác sĩ:* ${report.conclusion}\n`;
  }

  if (customNote && customNote.trim()) {
    msg += `• *Lời dặn Bác sĩ:* ${customNote.trim()}\n`;
  }

  if (report.cloudPdfUrl) {
    msg += `\n📄 *XEM & TẢI PHIẾU KẾT QUẢ XÉT NGHIỆM (PDF):*\n${report.cloudPdfUrl}\n`;
  }

  msg += `\n📱 *TRA CỨU NHANH BẰNG MÃ QR:*\n`;
  msg += `Quý khách có thể quét mã QR trên phiếu in hoặc mở link trên để xem kết quả mọi lúc, mọi nơi.\n\n`;
  msg += `📞 Hotline tư vấn: ${hotline} | Website: ${website}\n`;
  msg += `📍 Địa chỉ: ${address}\n`;
  msg += `_Chúc Quý khách và gia đình luôn dồi dào sức khỏe!_`;

  return msg;
}

/**
 * Mở cửa sổ chat Zalo 1-Click (https://zalo.me/{phone}) và tự động chép tin nhắn vào Clipboard
 */
export async function openZaloChat(phone: string, text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch (err) {
    console.warn('Could not write to clipboard:', err);
  }

  const cleanPhone = formatZaloMePhone(phone);
  if (!cleanPhone) {
    return false;
  }

  const zaloUrl = `https://zalo.me/${cleanPhone}`;
  window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Gửi tin nhắn tự động qua Zalo ZNS (Zalo Notification Service - Zalo Business OpenAPI)
 */
export async function sendZaloZnsNotification(
  config: ZaloZnsConfig,
  report: MedicalReport,
  clinicInfo: ClinicInfo,
  customNote?: string
): Promise<ZaloSendResult> {
  const phone = formatZaloPhone(report.patient.phone);
  if (!phone || phone.length < 9) {
    return {
      success: false,
      error: -1,
      message: 'Số điện thoại của bệnh nhân không hợp lệ (cần ít nhất 9-10 chữ số)!'
    };
  }

  const templateId = (config.templateId || '').trim();
  const accessToken = (config.accessToken || '').trim();

  if (!templateId || !accessToken) {
    return {
      success: false,
      error: -2,
      message: 'Chưa cấu hình Template ID hoặc Access Token Zalo OA trong Cài đặt / .env!'
    };
  }

  const dateStr = new Date(report.createdAt).toLocaleDateString('vi-VN');
  const templateData = {
    customer_name: report.patient.name || 'Quý Khách',
    patient_code: report.code,
    sample_code: report.sampleCode || report.code,
    order_date: dateStr,
    doctor_name: report.doctorName || report.patient?.doctor || 'BS. Trần Hoài Long',
    conclusion: report.conclusion || 'Đã có kết quả xét nghiệm',
    doctor_note: customNote || '',
    pdf_url: report.cloudPdfUrl || '',
    clinic_name: clinicInfo.name || 'TRUNG TÂM XÉT NGHIỆM GOLAB',
    hotline: clinicInfo.phone || '032.855.3773',
    website: clinicInfo.website || 'golab.com.vn'
  };

  const payload = {
    phone,
    template_id: templateId,
    template_data: templateData,
    tracking_id: report.code
  };

  // Endpoint: Ưu tiên Proxy URL nếu có cấu hình, ngược lại gọi trực tiếp Zalo OpenAPI
  const targetUrl = config.proxyUrl && config.proxyUrl.trim()
    ? config.proxyUrl.trim()
    : 'https://business.openapi.zalo.me/message/template';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': accessToken
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        error: response.status,
        message: `Máy chủ Zalo phản hồi lỗi HTTP ${response.status}: ${response.statusText}`
      };
    }

    const resJson = await response.json();

    if (resJson.error === 0) {
      return {
        success: true,
        msgId: resJson.data?.msg_id || 'ZNS_SENT',
        message: 'Đã gửi thông báo Zalo ZNS thành công tới Bệnh nhân!'
      };
    }

    // Dịch các mã lỗi phổ biến của Zalo ZNS sang tiếng Việt rõ ràng
    let vietnameseError = resJson.message || 'Gửi Zalo ZNS thất bại';
    switch (resJson.error) {
      case -108:
        vietnameseError = 'Số điện thoại này chưa đăng ký tài khoản Zalo hoặc từ chối nhận tin ZNS.';
        break;
      case -118:
        vietnameseError = 'Tài khoản Zalo Cloud đã hết số dư / hạn mức gửi tin ZNS.';
        break;
      case -124:
        vietnameseError = 'Access Token Zalo OA đã hết hạn. Vui lòng cập nhật Token mới trong Cài Đặt / .env.';
        break;
      case -130:
        vietnameseError = 'Dữ liệu không khớp với Template ZNS đã đăng ký trên Zalo Cloud.';
        break;
      case -140:
        vietnameseError = 'Template ID không tồn tại hoặc chưa được Zalo xét duyệt.';
        break;
      default:
        vietnameseError = `Lỗi Zalo ZNS [Mã ${resJson.error}]: ${resJson.message}`;
    }

    return {
      success: false,
      error: resJson.error,
      message: vietnameseError
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi mạng hoặc CORS';
    console.error('[ZaloZNS] Gửi tin ZNS lỗi:', err);
    return {
      success: false,
      error: -99,
      message: `Không thể kết nối đến máy chủ Zalo (${errMsg}). Bạn có thể dùng nút 'Mở Chat Zalo (1-Click)' để gửi trực tiếp.`
    };
  }
}

/**
 * Alias for sendZaloZnsNotification to match SendZaloModal
 */
export async function sendZaloZnsMessage(
  report: MedicalReport,
  clinicInfo: ClinicInfo,
  config: ZaloZnsConfig,
  customNote?: string
): Promise<ZaloSendResult> {
  return sendZaloZnsNotification(config, report, clinicInfo, customNote);
}

/**
 * Kiểm tra kết nối cấu hình Zalo OA (Access Token & Template ID)
 */
export async function testZaloConnection(
  config: ZaloZnsConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled) {
    return { success: false, message: 'Tính năng Zalo ZNS đang bị tắt.' };
  }
  if (!config.accessToken || !config.accessToken.trim()) {
    return { success: false, message: 'Chưa nhập Access Token Zalo OA!' };
  }

  try {
    const targetUrl = config.proxyUrl && config.proxyUrl.trim()
      ? config.proxyUrl.trim()
      : 'https://openapi.zalo.me/v2.0/oa/getoa';

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        access_token: config.accessToken.trim()
      }
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Máy chủ Zalo phản hồi lỗi HTTP ${res.status}: ${res.statusText}`
      };
    }

    const data = await res.json();
    if (data.error === 0) {
      const oaName = data.data?.name || 'Zalo Official Account';
      return {
        success: true,
        message: `Kết nối Zalo OA thành công! OA: "${oaName}" (ID: ${data.data?.oa_id || config.oaId || 'OK'})`
      };
    }

    return {
      success: false,
      message: `Lỗi Zalo OA [${data.error}]: ${data.message || 'Access Token không hợp lệ hoặc đã hết hạn.'}`
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi mạng hoặc CORS';
    return {
      success: false,
      message: `Không thể kết nối đến máy chủ Zalo (${errMsg})`
    };
  }
}
