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

    const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const rS = rLin <= 0.0031308 ? 12.92 * rLin : 1.055 * Math.pow(rLin, 1 / 2.4) - 0.055;
    const gS = gLin <= 0.0031308 ? 12.92 * gLin : 1.055 * Math.pow(gLin, 1 / 2.4) - 0.055;
    const bS = bLin <= 0.0031308 ? 12.92 * bLin : 1.055 * Math.pow(bLin, 1 / 2.4) - 0.055;

    const rVal = Math.round(Math.max(0, Math.min(255, rS * 255)));
    const gVal = Math.round(Math.max(0, Math.min(255, gS * 255)));
    const bVal = Math.round(Math.max(0, Math.min(255, bS * 255)));

    return `rgb(${rVal}, ${gVal}, ${bVal})`;
  } catch {
    return '#1e293b';
  }
}

export function convertCssColors(cssText: string): string {
  if (!cssText) return cssText;
  return cssText
    .replace(/oklch\([^)]+\)/gi, (m) => oklchToRgb(m))
    .replace(/oklab\([^)]+\)/gi, '#1e293b')
    .replace(/color-mix\([^)]+\)/gi, '#1e293b');
}

export interface ExportPdfResult {
  success: boolean;
  pdfBase64: string;
  pdfBlob?: Blob | null;
}

/**
 * Đảm bảo 100% tất cả hình ảnh (Logo, Con dấu, QR Code) trong phần tử đã decode hoàn tất
 */
export async function ensureImagesLoadedAndReady(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length === 0) return;

  const loadPromises = images.map((img) => {
    return new Promise<void>((resolve) => {
      // Chỉ đặt thuộc tính crossorigin cho URL từ xa (http/https), tuyệt đối không đặt cho data: URI
      if (img.src && (img.src.startsWith('http://') || img.src.startsWith('https://')) && !img.getAttribute('crossorigin')) {
        img.setAttribute('crossorigin', 'anonymous');
      } else if (img.src && img.src.startsWith('data:')) {
        img.removeAttribute('crossorigin');
      }
      img.loading = 'eager';

      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve(); // Timeout an toàn 2500ms, không bao giờ để tiến trình bị treo
      }, 2500);

      const onDone = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      img.onload = onDone;
      img.onerror = onDone;

      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().then(onDone).catch(onDone);
      }
    });
  });

  await Promise.all(loadPromises);
  // Nghỉ 80ms để trình duyệt hoàn tất paint layout
  await new Promise((resolve) => setTimeout(resolve, 80));
}

function sanitizeStylesForCanvas(clonedDoc: Document, printElementId: string) {
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent) {
      styleTag.textContent = convertCssColors(styleTag.textContent);
    }
  });

  try {
    const sheets = Array.from(clonedDoc.styleSheets);
    sheets.forEach((sheet) => {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) return;
        for (let i = rules.length - 1; i >= 0; i--) {
          const rule = rules[i] as CSSStyleRule;
          if (rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('oklab') || rule.cssText.includes('color-mix'))) {
            try {
              const cleaned = convertCssColors(rule.cssText);
              sheet.deleteRule(i);
              sheet.insertRule(cleaned, i);
            } catch {
              /* ignore single rule parse error */
            }
          }
        }
      } catch {
        /* ignore cross-origin sheet */
      }
    });
  } catch {
    /* ignore sheet error */
  }

  const printEl = clonedDoc.getElementById(printElementId);
  if (printEl) {
    printEl.style.display = 'block';
    printEl.style.visibility = 'visible';
    printEl.style.opacity = '1';
    printEl.style.position = 'static';
    printEl.style.transform = 'none';
    printEl.style.width = '210mm';
    printEl.style.minWidth = '210mm';
    printEl.style.maxWidth = '210mm';
    printEl.style.boxSizing = 'border-box';
    printEl.style.backgroundColor = '#ffffff';
    printEl.style.margin = '0 auto';

    const allElements = [printEl, ...Array.from(printEl.querySelectorAll('*'))];
    allElements.forEach((node) => {
      const htmlNode = node as HTMLElement;
      if (htmlNode.style) {
        const styleAttr = htmlNode.getAttribute('style') || '';
        if (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix')) {
          htmlNode.setAttribute('style', convertCssColors(styleAttr));
        }
      }

      // Đảm bảo tất cả thẻ img trong clonedDoc đều giữ đúng thuộc tính và nạp ngay
      if (htmlNode.tagName.toLowerCase() === 'img') {
        const img = htmlNode as HTMLImageElement;
        if (img.src && (img.src.startsWith('http://') || img.src.startsWith('https://'))) {
          img.crossOrigin = 'anonymous';
        } else {
          img.removeAttribute('crossorigin');
        }
        img.loading = 'eager';
      }
    });
  }
}

/**
 * Hàm xuất PDF cốt lõi: Render chất lượng cao, trả về đầy đủ Base64, Blob và tùy chọn lưu file
 */
export async function exportToPdfFull(
  printElementId: string,
  filename = 'Phieu_Ket_Qua_Xet_Nghiem.pdf',
  saveLocalFile = true
): Promise<ExportPdfResult> {
  const element = document.getElementById(printElementId);
  if (!element) {
    throw new Error(`Không tìm thấy phần tử HTML #${printElementId}`);
  }

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 600))
    ]);
  } catch {
    /* fallback font ready */
  }

  const container = element.closest('.fixed, [style]') || element.parentElement;
  const savedContainerStyle = container ? container.getAttribute('style') || '' : '';

  if (container && container !== element) {
    (container as HTMLElement).style.cssText =
      'position:fixed; left:0; top:0; width:210mm; min-width:210mm; z-index:-999; opacity:0; pointer-events:none; overflow:visible; transform:none;';
  }

  const originalDisplay = element.style.display;
  element.style.display = 'block';

  // 1. Chờ tất cả ảnh (Logo, Con dấu, QR) tải và decode hoàn tất 100% trước khi render PDF
  await ensureImagesLoadedAndReady(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2.2, // Tăng scale lên 2.2 để hình ảnh và chữ sắc nét tuyệt đối chuẩn in ấn A4
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      windowWidth: 1200, // Cố định chiều rộng ngữ cảnh desktop chuẩn A4
      onclone: (clonedDoc) => {
        sanitizeStylesForCanvas(clonedDoc, printElementId);
      }
    });

    element.style.display = originalDisplay;
    if (container && container !== element) {
      if (savedContainerStyle) {
        container.setAttribute('style', savedContainerStyle);
      } else {
        container.removeAttribute('style');
      }
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft >= 1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
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
