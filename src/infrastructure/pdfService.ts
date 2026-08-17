import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function sanitizeFilename(name: string, code: string, token: string): string {
  const cleanName = (name || 'BenhNhan')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .trim();

  const cleanCode = (code || 'XN').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanToken = (token || 'token').replace(/[^a-zA-Z0-9]/g, '');

  return `Phieu_Xet_Nghiem_${cleanName}_${cleanCode}_${cleanToken}.pdf`;
}

export function getPdfBase64(pdf: jsPDF): string {
  try {
    const arrayBuffer = pdf.output('arraybuffer');
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    return btoa(binary);
  } catch {
    const dataUri = pdf.output('datauristring') || pdf.output('dataurlstring') || '';
    const commaIndex = dataUri.indexOf(',');
    return commaIndex !== -1 ? dataUri.substring(commaIndex + 1) : '';
  }
}

/**
 * Chuyển đổi màu OKLCH (Tailwind v4) sang màu RGB chuẩn của trình duyệt
 * Giúp html2canvas và PDF xuất ra màu sắc chính xác 100% như màn hình xem trước.
 */
export function oklchToRgb(oklchStr: string): string {
  try {
    const match = oklchStr.match(/oklch\(\s*([\d.%]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i);
    if (!match) return '#1e293b';

    let L = parseFloat(match[1]);
    if (match[1].endsWith('%')) L = L / 100;
    const C = parseFloat(match[2]);
    const H = parseFloat(match[3]);

    const hRad = (H * Math.PI) / 180;
    const aLab = C * Math.cos(hRad);
    const bLab = C * Math.sin(hRad);

    const l_ = L + 0.3963377774 * aLab + 0.2158037573 * bLab;
    const m_ = L - 0.1055613458 * aLab - 0.0638541728 * bLab;
    const s_ = L - 0.0894841775 * aLab - 1.2914855480 * bLab;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const toSRGB = (c: number) => {
      const clamped = Math.max(0, Math.min(1, c));
      return clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    };

    const R = Math.round(toSRGB(r) * 255);
    const G = Math.round(toSRGB(g) * 255);
    const B = Math.round(toSRGB(b) * 255);

    return `rgb(${R}, ${G}, ${B})`;
  } catch {
    return '#1e293b';
  }
}

/**
 * Đảm bảo các style của phần tử clone được xử lý tương thích với html2canvas
 */
export function sanitizeStylesForCanvas(clonedDoc: Document, printElementId: string): void {
  const clonedElement = clonedDoc.getElementById(printElementId);
  if (!clonedElement) return;

  clonedElement.style.display = 'block';
  clonedElement.style.position = 'static';
  clonedElement.style.visibility = 'visible';
  clonedElement.style.opacity = '1';
  clonedElement.style.transform = 'none';

  const allElements = clonedElement.querySelectorAll('*');
  allElements.forEach((node) => {
    const el = node as HTMLElement;
    if (el.style) {
      if (el.style.color && el.style.color.includes('oklch')) {
        el.style.color = oklchToRgb(el.style.color);
      }
      if (el.style.backgroundColor && el.style.backgroundColor.includes('oklch')) {
        el.style.backgroundColor = oklchToRgb(el.style.backgroundColor);
      }
      if (el.style.borderColor && el.style.borderColor.includes('oklch')) {
        el.style.borderColor = oklchToRgb(el.style.borderColor);
      }
    }
  });
}

export interface ExportPdfResult {
  success: boolean;
  pdfBase64?: string;
  pdfBlob?: Blob;
  error?: string;
}

export async function ensureImagesLoadedAndReady(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length === 0) return;

  await Promise.all(
    images.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }
      if (typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          /* Ignore decode error */
        }
      }
    })
  );
}

/**
 * Xuất phiếu trả kết quả ra file PDF A4 chuẩn y khoa
 * - Độ phân giải siêu nét (scale 2.5)
 * - Tự động nhận diện trang rời (.report-page) hoặc phân trang thông minh (avoid-break)
 */
export async function exportToPdfFull(
  printElementId: string,
  filename = 'Phieu_Ket_Qua_Xet_Nghiem.pdf',
  saveLocalFile = true
): Promise<ExportPdfResult> {
  const element = document.getElementById(printElementId);
  if (!element) {
    throw new Error(`Không tìm thấy phần tử HTML với ID: ${printElementId}`);
  }

  const container = element.parentElement;
  let savedContainerStyle = '';
  if (container && container !== element) {
    savedContainerStyle = container.getAttribute('style') || '';
    container.style.display = 'block';
    container.style.position = 'absolute';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.width = '794px';
    container.style.maxWidth = '794px';
    container.style.opacity = '1';
    container.style.zIndex = '-9999';
    container.style.visibility = 'visible';
    container.style.pointerEvents = 'none';
  }

  const originalDisplay = element.style.display;
  element.style.display = 'block';

  // 1. Chờ tất cả ảnh (Logo, Con dấu, QR) tải và decode hoàn tất 100% trước khi render PDF
  await ensureImagesLoadedAndReady(element);

  // 2. Thu thập danh sách vị trí các phần tử cần tránh cắt đôi (Avoid-Break Elements)
  const containerRect = element.getBoundingClientRect();
  const avoidSelector = '[data-avoid-break="true"], tr, .signature-section, .patient-table-section, .conclusion-section, .avoid-break';
  const avoidElements = Array.from(element.querySelectorAll(avoidSelector));
  const avoidBoxes = avoidElements.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top - containerRect.top,
      bottom: rect.bottom - containerRect.top,
      height: rect.height
    };
  });

  try {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Kiểm tra xem phần tử có chứa các trang độc lập (.report-page) không
    const reportPages = Array.from(element.querySelectorAll<HTMLElement>('.report-page'));

    if (reportPages.length > 0) {
      // 1. CHẾ ĐỘ XUẤT THEO TỪNG TRANG CHUẨN (.report-page)
      for (let pIdx = 0; pIdx < reportPages.length; pIdx++) {
        const pageEl = reportPages[pIdx];
        const pageCanvas = await html2canvas(pageEl, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          windowWidth: 794,
          onclone: (clonedDoc) => {
            sanitizeStylesForCanvas(clonedDoc, printElementId);
          }
        });

        const imgData = pageCanvas.toDataURL('image/png');
        const pagePdfHeight = (pageCanvas.height * pdfWidth) / pageCanvas.width;

        if (pIdx > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          'PNG',
          0,
          0,
          pdfWidth,
          Math.min(pdfHeight, pagePdfHeight),
          undefined,
          'SLOW'
        );
      }
    } else {
      // 2. CHẾ ĐỘ PHÂN TRANG THÔNG MINH (SMART PAGINATION ENGINE) CHO CÁC PHIẾU LIÊN TỤC
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        windowWidth: element.offsetWidth || 794,
        onclone: (clonedDoc) => {
          sanitizeStylesForCanvas(clonedDoc, printElementId);
        }
      });

      // Chiều cao chuẩn 1 trang A4 tính theo tọa độ pixel của Canvas
      const pageCanvasHeight = (canvas.width * pdfHeight) / pdfWidth;
      const scaleToCanvas = containerRect.height > 0 ? canvas.height / containerRect.height : 1;

      // Chuyển đổi vị trí các khối cần bảo vệ sang tọa độ Canvas
      const scaledAvoidBoxes = avoidBoxes.map((b) => ({
        top: b.top * scaleToCanvas,
        bottom: b.bottom * scaleToCanvas,
        height: b.height * scaleToCanvas
      }));

      let currentY = 0;
      const pageSlices: { startY: number; endY: number }[] = [];

      while (currentY < canvas.height - 2) {
        const remainingHeight = canvas.height - currentY;

        if (remainingHeight <= pageCanvasHeight) {
          pageSlices.push({ startY: currentY, endY: canvas.height });
          break;
        }

        const idealEndY = currentY + pageCanvasHeight;
        let bestSplitY = idealEndY;

        for (const box of scaledAvoidBoxes) {
          if (box.top < idealEndY && box.bottom > idealEndY) {
            if (box.top > currentY + pageCanvasHeight * 0.2) {
              bestSplitY = Math.min(bestSplitY, box.top);
            }
          }
        }

        if (bestSplitY <= currentY + pageCanvasHeight * 0.2) {
          bestSplitY = idealEndY;
        }

        pageSlices.push({ startY: currentY, endY: bestSplitY });
        currentY = bestSplitY;
      }

      for (let i = 0; i < pageSlices.length; i++) {
        const slice = pageSlices[i];
        const sliceHeight = slice.endY - slice.startY;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        const topPadding = i > 0 ? 35 : 0;
        sliceCanvas.height = Math.max(1, Math.round(sliceHeight + topPadding));
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0, slice.startY, canvas.width, sliceHeight,
            0, topPadding, sliceCanvas.width, sliceHeight
          );
        }

        const sliceImgData = sliceCanvas.toDataURL('image/png');
        const slicePdfHeight = (sliceCanvas.height * pdfWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          sliceImgData,
          'PNG',
          0,
          0,
          pdfWidth,
          slicePdfHeight,
          undefined,
          'SLOW'
        );
      }
    }

    element.style.display = originalDisplay;
    if (container && container !== element) {
      if (savedContainerStyle) {
        container.setAttribute('style', savedContainerStyle);
      } else {
        container.removeAttribute('style');
      }
    }

    if (saveLocalFile) {
      pdf.save(filename);
    }

    const pdfBase64 = getPdfBase64(pdf);
    const pdfBlob = pdf.output('blob');

    return {
      success: true,
      pdfBase64,
      pdfBlob
    };
  } catch (err) {
    element.style.display = originalDisplay;
    if (container && container !== element) {
      if (savedContainerStyle) {
        container.setAttribute('style', savedContainerStyle);
      } else {
        container.removeAttribute('style');
      }
    }
    console.error('Lỗi khi tạo PDF:', err);
    throw err;
  }
}

export async function exportToPdf(
  printElementId: string,
  filename = 'Phieu_Ket_Qua_Xet_Nghiem.pdf'
): Promise<ExportPdfResult> {
  return exportToPdfFull(printElementId, filename, true);
}

export async function exportElementToPdfBlob(
  printElementId: string,
  filename = 'Phieu_Ket_Qua_Xet_Nghiem.pdf'
): Promise<Blob | null> {
  try {
    const result = await exportToPdfFull(printElementId, filename, false);
    return result.pdfBlob || null;
  } catch (err) {
    console.error('Lỗi khi tạo PDF blob:', err);
    return null;
  }
}
