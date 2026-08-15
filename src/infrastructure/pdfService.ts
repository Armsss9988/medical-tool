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

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(printElementId);
        if (clonedEl) {
          clonedEl.style.position = 'static';
          clonedEl.style.transform = 'none';
          clonedEl.style.opacity = '1';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.display = 'block';

          const allElements = clonedEl.querySelectorAll('*');
          allElements.forEach((node) => {
            const htmlNode = node as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlNode);
            const color = computedStyle.color;
            const bgColor = computedStyle.backgroundColor;
            const borderColor = computedStyle.borderColor;

            if (color && (color.includes('oklch') || color.includes('oklab') || color.includes('color-mix'))) {
              htmlNode.style.color = '#0f172a';
            }
            if (bgColor && (bgColor.includes('oklch') || bgColor.includes('oklab') || bgColor.includes('color-mix'))) {
              htmlNode.style.backgroundColor = '#ffffff';
            }
            if (borderColor && (borderColor.includes('oklch') || borderColor.includes('oklab') || borderColor.includes('color-mix'))) {
              htmlNode.style.borderColor = '#cbd5e1';
            }
          });
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);

    const pdfBase64 = pdf.output('datauristring');
    return { success: true, pdfBase64 };
  } finally {
    if (container && container !== element) {
      (container as HTMLElement).style.cssText = savedContainerStyle;
    }
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
    /* fallback */
  }

  const container = element.closest('.fixed, [style]') || element.parentElement;
  const savedContainerStyle = container ? container.getAttribute('style') || '' : '';

  if (container && container !== element) {
    (container as HTMLElement).style.cssText =
      'position:fixed; left:0; top:0; z-index:-1; opacity:0; pointer-events:none;';
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(printElementId);
        if (clonedEl) {
          clonedEl.style.position = 'static';
          clonedEl.style.transform = 'none';
          clonedEl.style.opacity = '1';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.display = 'block';

          const allElements = clonedEl.querySelectorAll('*');
          allElements.forEach((node) => {
            const htmlNode = node as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlNode);
            const color = computedStyle.color;
            const bgColor = computedStyle.backgroundColor;
            const borderColor = computedStyle.borderColor;

            if (color && (color.includes('oklch') || color.includes('oklab') || color.includes('color-mix'))) {
              htmlNode.style.color = '#0f172a';
            }
            if (bgColor && (bgColor.includes('oklch') || bgColor.includes('oklab') || bgColor.includes('color-mix'))) {
              htmlNode.style.backgroundColor = '#ffffff';
            }
            if (borderColor && (borderColor.includes('oklch') || borderColor.includes('oklab') || borderColor.includes('color-mix'))) {
              htmlNode.style.borderColor = '#cbd5e1';
            }
          });
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);

    return pdf.output('blob');
  } catch (err) {
    console.error('Lỗi khi xuất PDF Blob:', err);
    return null;
  } finally {
    if (container && container !== element) {
      (container as HTMLElement).style.cssText = savedContainerStyle;
    }
  }
}
