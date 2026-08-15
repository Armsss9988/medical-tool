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

export interface ExportPdfResult {
  success: boolean;
  pdfBase64: string;
}

function sanitizeStylesForCanvas(clonedDoc: Document, printElementId: string) {
  // 1. Replace oklch/oklab/color-mix in all <style> tags
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent) {
      styleTag.textContent = styleTag.textContent
        .replace(/oklch\([^)]+\)/gi, '#0f172a')
        .replace(/oklab\([^)]+\)/gi, '#0f172a')
        .replace(/color-mix\([^)]+\)/gi, '#0f172a');
    }
  });

  // 2. Replace oklch/oklab/color-mix in accessible CSS rules
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
              const cleaned = rule.cssText
                .replace(/oklch\([^)]+\)/gi, '#0f172a')
                .replace(/oklab\([^)]+\)/gi, '#0f172a')
                .replace(/color-mix\([^)]+\)/gi, '#0f172a');
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

  // 3. Ensure targeted element is visible and inline styles cleaned
  const printEl = clonedDoc.getElementById(printElementId);
  if (printEl) {
    printEl.style.display = 'block';
    printEl.style.visibility = 'visible';
    printEl.style.opacity = '1';
    printEl.style.position = 'static';
    printEl.style.transform = 'none';

    const allElements = [printEl, ...Array.from(printEl.querySelectorAll('*'))];
    allElements.forEach((node) => {
      const htmlNode = node as HTMLElement;
      if (htmlNode.style) {
        const styleAttr = htmlNode.getAttribute('style') || '';
        if (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix')) {
          htmlNode.setAttribute(
            'style',
            styleAttr
              .replace(/oklch\([^)]+\)/gi, '#0f172a')
              .replace(/oklab\([^)]+\)/gi, '#0f172a')
              .replace(/color-mix\([^)]+\)/gi, '#0f172a')
          );
        }
      }
    });
  }
}

export async function exportToPdf(
  printElementId: string,
  filename = 'Phieu_Ket_Qua_Xet_Nghiem.pdf'
): Promise<ExportPdfResult> {
  const element = document.getElementById(printElementId);
  if (!element) {
    throw new Error(`Không tìm thấy phần tử HTML #${printElementId}`);
  }

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 500))
    ]);
  } catch {
    /* fallback font ready */
  }

  const container = element.closest('.fixed, [style]') || element.parentElement;
  const savedContainerStyle = container ? container.getAttribute('style') || '' : '';

  if (container && container !== element) {
    (container as HTMLElement).style.cssText =
      'position:fixed; left:0; top:0; z-index:-1; opacity:0; pointer-events:none;';
  }

  const originalDisplay = element.style.display;
  element.style.display = 'block';

  await new Promise((r) => setTimeout(r, 100));

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
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

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
    const pdfBase64 = pdf.output('datauristring').split(',')[1] || '';

    return {
      success: true,
      pdfBase64
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

export async function exportElementToPdfBlob(
  printElementId: string,
  filename = 'Phieu_Ket_Qua_Xet_Nghiem.pdf'
): Promise<Blob | null> {
  const element = document.getElementById(printElementId);
  if (!element) {
    console.error(`Không tìm thấy phần tử HTML #${printElementId}`);
    return null;
  }

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 500))
    ]);
  } catch {
    /* fallback font ready */
  }

  const container = element.closest('.fixed, [style]') || element.parentElement;
  const savedContainerStyle = container ? container.getAttribute('style') || '' : '';

  if (container && container !== element) {
    (container as HTMLElement).style.cssText =
      'position:fixed; left:0; top:0; z-index:-1; opacity:0; pointer-events:none;';
  }

  const originalDisplay = element.style.display;
  element.style.display = 'block';

  await new Promise((r) => setTimeout(r, 100));

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
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

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
    return pdf.output('blob');
  } catch (err) {
    element.style.display = originalDisplay;
    if (container && container !== element) {
      if (savedContainerStyle) {
        container.setAttribute('style', savedContainerStyle);
      } else {
        container.removeAttribute('style');
      }
    }
    console.error('Lỗi khi xuất PDF Blob:', err);
    return null;
  }
}
