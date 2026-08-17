import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportResult {
  pdf: jsPDF;
  blob: Blob;
  base64: string;
}

/**
 * Chuyển đổi mã màu OKLCH toán học sang RGB chuẩn
 */
function oklchToRgb(str: string): string {
  if (!str || !str.includes('oklch')) return str;
  return str.replace(/oklch\(([^)]+)\)/gi, (_match, p1) => {
    const parts = p1.trim().split(/[\s/]+/);
    let l = parseFloat(parts[0]);
    if (parts[0].includes('%')) l = parseFloat(parts[0]) / 100;
    const c = parseFloat(parts[1]) || 0;
    const h = parseFloat(parts[2]) || 0;

    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;

    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;

    let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    let bVal = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

    const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x * 255)));
    return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(bVal)})`;
  });
}

function sanitizeOklchColors(element: HTMLElement) {
  const elements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
  elements.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.color && style.color.includes('oklch')) {
      el.style.color = oklchToRgb(style.color);
    }
    if (style.backgroundColor && style.backgroundColor.includes('oklch')) {
      el.style.backgroundColor = oklchToRgb(style.backgroundColor);
    }
    if (style.borderColor && style.borderColor.includes('oklch')) {
      el.style.borderColor = oklchToRgb(style.borderColor);
    }
  });
}

/**
 * Chụp và xuất PDF chất lượng cao (Scale 2.5, đa trang thông minh, hỗ trợ Booklet Dị nguyên)
 */
export async function generateHighQualityPdf(
  elementId: string,
  filename: string = 'PhieuKetQua.pdf'
): Promise<PdfExportResult> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Không tìm thấy phần tử DOM với id="${elementId}" để xuất PDF!`);
  }

  // Tạm thời chuẩn hóa màu sắc và hình ảnh
  sanitizeOklchColors(element);

  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  // Kiểm tra nếu là báo cáo nhiều trang phân tách (FullAllergenReportView với `.report-page`)
  const childPages = Array.from(element.querySelectorAll('.report-page')) as HTMLElement[];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  if (childPages.length > 0) {
    // -------------------------------------------------------------
    // CHẾ ĐỘ XUẤT ĐA TRANG (BOOKLET / PANEL DỊ NGUYÊN)
    // -------------------------------------------------------------
    for (let i = 0; i < childPages.length; i++) {
      const pageEl = childPages[i];
      sanitizeOklchColors(pageEl);

      const canvas = await html2canvas(pageEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
  } else {
    // -------------------------------------------------------------
    // CHẾ ĐỘ XUẤT LIÊN TỤC (XÉT NGHIỆM THƯỜNG / TRÁNH CẮT ĐÔI KHỐI)
    // -------------------------------------------------------------
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000
    });

    const imgWidth = pdfWidth;
    const pageHeightInMm = pdfHeight;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeightInMm) {
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Phân trang tự động thông minh
      const pageCanvasHeight = (canvas.width * pageHeightInMm) / imgWidth;
      let renderedHeight = 0;
      let pageIdx = 0;

      while (renderedHeight < canvas.height) {
        const remainingCanvasHeight = canvas.height - renderedHeight;
        const currentSliceCanvasHeight = Math.min(pageCanvasHeight, remainingCanvasHeight);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = currentSliceCanvasHeight;
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            currentSliceCanvasHeight,
            0,
            0,
            canvas.width,
            currentSliceCanvasHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
        const currentSliceMmHeight = (currentSliceCanvasHeight * imgWidth) / canvas.width;

        if (pageIdx > 0) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, currentSliceMmHeight, undefined, 'FAST');
        renderedHeight += currentSliceCanvasHeight;
        pageIdx++;
      }
    }
  }

  const blob = pdf.output('blob');
  const base64 = pdf.output('datauristring');

  return { pdf, blob, base64 };
}
