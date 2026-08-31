import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportResult {
  pdf: jsPDF;
  blob: Blob;
  base64: string;
}

/**
 * Chuyển đổi OKLCH toán học sang RGB/RGBA chuẩn
 */
function oklchToRgbMath(p1: string): string {
  try {
    const clean = p1.trim().replace(/,/g, ' ');
    const parts = clean.split(/[\s/]+/).filter(Boolean);
    if (parts.length === 0) return 'rgb(0,0,0)';

    let l = parseFloat(parts[0]);
    if (parts[0].includes('%')) l = parseFloat(parts[0]) / 100;
    if (isNaN(l)) l = 0;

    let c = 0;
    if (parts[1] && parts[1] !== 'none') {
      c = parseFloat(parts[1]);
      if (parts[1].includes('%')) c = (parseFloat(parts[1]) / 100) * 0.4;
      if (isNaN(c)) c = 0;
    }

    let h = 0;
    if (parts[2] && parts[2] !== 'none') {
      h = parseFloat(parts[2].replace(/deg/i, ''));
      if (isNaN(h)) h = 0;
    }

    let alpha = 1;
    if (parts.length > 3 && parts[3] !== 'none') {
      alpha = parseFloat(parts[3]);
      if (parts[3].includes('%')) alpha = parseFloat(parts[3]) / 100;
      if (isNaN(alpha)) alpha = 1;
    }

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
    if (alpha < 1) {
      return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(bVal)}, ${alpha})`;
    }
    return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(bVal)})`;
  } catch {
    return '#000000';
  }
}

/**
 * Chuyển đổi OKLab / Lab toán học sang RGB/RGBA chuẩn
 */
function oklabToRgbMath(p1: string): string {
  try {
    const clean = p1.trim().replace(/,/g, ' ');
    const parts = clean.split(/[\s/]+/).filter(Boolean);
    if (parts.length === 0) return 'rgb(0,0,0)';

    let l = parseFloat(parts[0]);
    if (parts[0].includes('%')) l = parseFloat(parts[0]) / 100;
    if (isNaN(l)) l = 0;

    let a = 0;
    if (parts[1] && parts[1] !== 'none') {
      a = parseFloat(parts[1]);
      if (parts[1].includes('%')) a = (parseFloat(parts[1]) / 100) * 0.4;
      if (isNaN(a)) a = 0;
    }

    let b = 0;
    if (parts[2] && parts[2] !== 'none') {
      b = parseFloat(parts[2]);
      if (parts[2].includes('%')) b = (parseFloat(parts[2]) / 100) * 0.4;
      if (isNaN(b)) b = 0;
    }

    let alpha = 1;
    if (parts.length > 3 && parts[3] !== 'none') {
      alpha = parseFloat(parts[3]);
      if (parts[3].includes('%')) alpha = parseFloat(parts[3]) / 100;
      if (isNaN(alpha)) alpha = 1;
    }

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
    if (alpha < 1) {
      return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(bVal)}, ${alpha})`;
    }
    return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(bVal)})`;
  } catch {
    return '#000000';
  }
}

/**
 * Chuyển đổi toàn bộ các hàm màu CSS hiện đại (OKLCH, OKLab, Lab, LCH, Color, Color-Mix) sang RGB/RGBA chuẩn
 */
export function sanitizeAllModernColors(str: string): string {
  if (!str || typeof str !== 'string') return str;

  let res = str;

  // 1. OKLCH
  if (res.includes('oklch')) {
    res = res.replace(/oklch\(\s*([^)]+)\s*\)/gis, (_match, p1) => oklchToRgbMath(p1));
  }

  // 2. OKLab
  if (res.includes('oklab')) {
    res = res.replace(/oklab\(\s*([^)]+)\s*\)/gis, (_match, p1) => oklabToRgbMath(p1));
  }

  // 3. CIE Lab
  if (res.includes('lab(')) {
    res = res.replace(/lab\(\s*([^)]+)\s*\)/gis, (_match, p1) => oklabToRgbMath(p1));
  }

  // 4. CIE LCH
  if (res.includes('lch(')) {
    res = res.replace(/lch\(\s*([^)]+)\s*\)/gis, (_match, p1) => oklchToRgbMath(p1));
  }

  // 5. color(...) & color-mix(...)
  if (res.includes('color(') || res.includes('color-mix(')) {
    res = res.replace(/color-mix\([^)]+\)/gis, 'rgb(30, 41, 59)');
    res = res.replace(/color\([^)]+\)/gis, 'rgb(30, 41, 59)');
  }

  return res;
}

export function oklchToRgb(str: string): string {
  return sanitizeAllModernColors(str);
}

/**
 * Quét và thay thế toàn bộ mã màu hiện đại trong Document và Iframe được html2canvas clone
 */
export function sanitizeDocumentOklch(doc: Document | HTMLElement) {
  // 1. Quét và thay thế tất cả thẻ <style> (tránh html2canvas CSSOM parser crash cho oklab/oklch/lab)
  const styleTags = Array.from(doc.querySelectorAll('style'));
  styleTags.forEach((s) => {
    if (s.textContent && (s.textContent.includes('okl') || s.textContent.includes('lab(') || s.textContent.includes('lch(') || s.textContent.includes('color('))) {
      s.textContent = sanitizeAllModernColors(s.textContent);
    }
  });

  // 2. Quét và chuyển đổi các thuộc tính màu trên từng phần tử DOM
  const allEls = Array.from(doc.querySelectorAll('*')) as HTMLElement[];
  const colorProps: Array<keyof CSSStyleDeclaration & string> = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'fill',
    'stroke',
    'textDecorationColor'
  ];

  allEls.forEach((el) => {
    // Check inline style attribute
    const inlineStyle = el.getAttribute('style');
    if (inlineStyle && (inlineStyle.includes('okl') || inlineStyle.includes('lab(') || inlineStyle.includes('lch('))) {
      el.setAttribute('style', sanitizeAllModernColors(inlineStyle));
    }

    try {
      const comp = window.getComputedStyle(el);
      for (const prop of colorProps) {
        const val = comp[prop];
        if (typeof val === 'string' && (val.includes('okl') || val.includes('lab(') || val.includes('lch('))) {
          el.style.setProperty(prop.replace(/([A-Z])/g, '-$1').toLowerCase(), sanitizeAllModernColors(val));
        }
      }
    } catch {
      /* ignore computed style exception */
    }
  });
}

/**
 * Chụp và xuất PDF chất lượng cao (Scale 2.5, đa trang thông minh, hỗ trợ Booklet Dị nguyên)
 */
export async function generateHighQualityPdf(
  elementId: string,
  _filename: string = 'PhieuKetQua.pdf'
): Promise<PdfExportResult> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Không tìm thấy phần tử DOM với id="${elementId}" để xuất PDF!`);
  }

  // Tiền xử lý màu sắc trên DOM thực
  sanitizeDocumentOklch(element);

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

  const html2canvasCommonOptions = {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
    onclone: async (clonedDoc: Document) => {
      sanitizeDocumentOklch(clonedDoc);
      // Đảm bảo tất cả <img> SVG Data URI đã load xong trong clone DOM
      const clonedImgs = Array.from(clonedDoc.querySelectorAll('img[src^="data:image/svg"]'));
      await Promise.all(
        clonedImgs.map((img) => {
          const el = img as HTMLImageElement;
          if (el.complete && el.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            el.onload = () => resolve();
            el.onerror = () => resolve();
          });
        })
      );
    }
  };

  if (childPages.length > 0) {
    // -------------------------------------------------------------
    // CHẾ ĐỘ XUẤT ĐA TRANG (BOOKLET / PANEL DỊ NGUYÊN)
    // -------------------------------------------------------------
    for (let i = 0; i < childPages.length; i++) {
      const pageEl = childPages[i];
      sanitizeDocumentOklch(pageEl);

      const canvas = await html2canvas(pageEl, html2canvasCommonOptions);
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
    const canvas = await html2canvas(element, html2canvasCommonOptions);

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

/**
 * Tải trực tiếp file PDF chất lượng cao về máy tính người dùng (1-Click Download)
 */
export async function downloadPdfDirectly(
  elementId: string,
  filename: string = 'PhieuKetQua.pdf'
): Promise<Blob> {
  const res = await generateHighQualityPdf(elementId, filename);
  try {
    res.pdf.save(filename);
  } catch {
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return res.blob;
}
