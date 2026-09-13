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
 * Thay thế hàm CSS có hỗ trợ ngoặc lồng nhau (nested parentheses) như color-mix(in oklab, var(...) 20%, transparent)
 */
function replaceBalancedFunction(str: string, fnName: string, replacer: (content: string) => string): string {
  let idx = 0;
  const target = fnName + '(';
  while ((idx = str.toLowerCase().indexOf(target, idx)) !== -1) {
    let depth = 1;
    let end = idx + target.length;
    while (end < str.length && depth > 0) {
      if (str[end] === '(') depth++;
      else if (str[end] === ')') depth--;
      end++;
    }
    if (depth === 0) {
      const inner = str.slice(idx + target.length, end - 1);
      const replacement = replacer(inner);
      str = str.slice(0, idx) + replacement + str.slice(end);
      idx += replacement.length;
    } else {
      idx += target.length;
    }
  }
  return str;
}

/**
 * Chuyển đổi toàn bộ các hàm màu CSS hiện đại (OKLCH, OKLab, Lab, LCH, Color, Color-Mix) sang RGB/RGBA chuẩn
 */
export function sanitizeAllModernColors(str: string): string {
  if (!str || typeof str !== 'string') return str;

  let res = str;

  // 1. color-mix(...) và color(...) xử lý trước với ngoặc lồng nhau đầy đủ
  if (res.includes('color-mix(')) {
    res = replaceBalancedFunction(res, 'color-mix', () => 'rgb(30, 41, 59)');
  }
  if (res.includes('color(')) {
    res = replaceBalancedFunction(res, 'color', () => 'rgb(30, 41, 59)');
  }

  // 2. OKLCH
  if (res.includes('oklch(')) {
    res = replaceBalancedFunction(res, 'oklch', (inner) => oklchToRgbMath(inner));
  } else if (res.includes('oklch')) {
    res = res.replace(/oklch\(\s*([^)]+)\s*\)/gis, (_match, p1) => oklchToRgbMath(p1));
  }

  // 3. OKLab
  if (res.includes('oklab(')) {
    res = replaceBalancedFunction(res, 'oklab', (inner) => oklabToRgbMath(inner));
  } else if (res.includes('oklab')) {
    res = res.replace(/oklab\(\s*([^)]+)\s*\)/gis, (_match, p1) => oklabToRgbMath(p1));
  }

  // 4. CIE Lab
  if (res.includes('lab(')) {
    res = replaceBalancedFunction(res, 'lab', (inner) => oklabToRgbMath(inner));
  }

  // 5. CIE LCH
  if (res.includes('lch(')) {
    res = replaceBalancedFunction(res, 'lch', (inner) => oklchToRgbMath(inner));
  }

  return res;
}

export function oklchToRgb(str: string): string {
  return sanitizeAllModernColors(str);
}

/**
 * Đón chặn getComputedStyle để chuyển đổi tự động mọi giá trị màu OKLCH/OKLab sang RGB/RGBA on-the-fly
 * Khắc phục triệt để lỗi "Attempting to parse an unsupported color function 'oklab'" trong html2canvas
 */
export function patchWindowGetComputedStyle(win: Window | null | undefined): () => void {
  if (!win || !win.getComputedStyle) return () => {};
  const anyWin = win as unknown as {
    getComputedStyle: typeof win.getComputedStyle;
    __isOklabPatched?: boolean;
  };
  if (anyWin.__isOklabPatched) return () => {};

  const originalGetComputedStyle = win.getComputedStyle.bind(win);

  const proxyHandler: ProxyHandler<CSSStyleDeclaration> = {
    get(target, prop) {
      let value: unknown;
      try {
        // QUAN TRỌNG: Truyền target làm receiver thứ 3 để native getter của trình duyệt nhận đúng this là CSSStyleDeclaration
        // Tránh lỗi "TypeError: Illegal invocation" do V8/Blink Web IDL kiểm tra brand check
        value = Reflect.get(target, prop, target);
      } catch {
        try {
          value = (target as unknown as Record<string | symbol, unknown>)[prop];
        } catch {
          return undefined;
        }
      }
      if (typeof value === 'string') {
        if (value.includes('okl') || value.includes('lab(') || value.includes('lch(') || value.includes('color(')) {
          return sanitizeAllModernColors(value);
        }
        return value;
      }
      if (typeof value === 'function') {
        return function (...args: unknown[]) {
          try {
            const res = (value as (...a: unknown[]) => unknown).apply(target, args);
            if (typeof res === 'string' && (res.includes('okl') || res.includes('lab(') || res.includes('lch(') || res.includes('color('))) {
              return sanitizeAllModernColors(res);
            }
            return res;
          } catch {
            return undefined;
          }
        };
      }
      return value;
    }
  };

  win.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const orig = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(orig, proxyHandler);
  };
  anyWin.__isOklabPatched = true;

  return () => {
    win.getComputedStyle = originalGetComputedStyle;
    delete anyWin.__isOklabPatched;
  };
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

  // 2. Chuyển đổi siêu tốc các phần tử có inline style chứa màu hiện đại (dùng CSS selector gốc C++, tránh quét 1000+ DOM nodes và gây layout thrashing)
  try {
    const inlineEls = Array.from(doc.querySelectorAll<HTMLElement>('[style*="okl"], [style*="lab"], [style*="lch"], [style*="color("]'));
    inlineEls.forEach((el) => {
      const inlineStyle = el.getAttribute('style');
      if (inlineStyle && (inlineStyle.includes('okl') || inlineStyle.includes('lab(') || inlineStyle.includes('lch(') || inlineStyle.includes('color('))) {
        el.setAttribute('style', sanitizeAllModernColors(inlineStyle));
      }
    });

    // 3. Quét các thuộc tính màu đặc biệt của SVG (fill, stroke)
    const svgEls = Array.from(doc.querySelectorAll<SVGElement>('[fill*="okl"], [stroke*="okl"], [fill*="lab"], [stroke*="lab"]'));
    svgEls.forEach((el) => {
      const fill = el.getAttribute('fill');
      if (fill) el.setAttribute('fill', sanitizeAllModernColors(fill));
      const stroke = el.getAttribute('stroke');
      if (stroke) el.setAttribute('stroke', sanitizeAllModernColors(stroke));
    });
  } catch {
    /* ignore querySelector error */
  }
}

export interface PdfProgressInfo {
  step: 'preparing' | 'rendering_pages' | 'generating_pdf' | 'saving' | 'completed';
  currentPage?: number;
  totalPages?: number;
  message: string;
  percent: number;
}

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a5';
  onProgress?: (progress: PdfProgressInfo) => void;
}

/**
 * Chụp và xuất PDF chất lượng cao (Scale 2.0, đa trang thông minh, hỗ trợ Booklet Dị nguyên)
 */
export async function generateHighQualityPdf(
  elementId: string,
  _filename: string = 'PhieuKetQua.pdf',
  options?: PdfExportOptions
): Promise<PdfExportResult> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Không tìm thấy phần tử DOM với id="${elementId}" để xuất PDF!`);
  }

  const restoreMainWin = patchWindowGetComputedStyle(typeof window !== 'undefined' ? window : null);
  try {

  options?.onProgress?.({
    step: 'preparing',
    message: 'Đang chuẩn hóa màu sắc & nạp hình ảnh...',
    percent: 10
  });

  // Nhường 1 macrotask tick để trình duyệt vẽ ngay lập tức modal tiến trình (0ms lag)
  await new Promise((resolve) => setTimeout(resolve, 30));

  // Tiền xử lý màu sắc trên DOM thực
  sanitizeDocumentOklch(element);

  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete || !img.src || img.src === window.location.href) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 2500);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); resolve(); };
      });
    })
  );

  // Kiểm tra nếu là báo cáo nhiều trang phân tách (FullAllergenReportView với `.report-page` hoặc phân trang `data-page-break`)
  const childPages = Array.from(element.querySelectorAll('.report-page, [data-page-break]')) as HTMLElement[];

  const orientation = options?.orientation || 'portrait';
  const format = options?.format || 'a4';

  let pdfWidth = 210;
  let pdfHeight = 297;

  if (format === 'a5') {
    if (orientation === 'landscape') {
      pdfWidth = 210;
      pdfHeight = 148;
    } else {
      pdfWidth = 148;
      pdfHeight = 210;
    }
  } else {
    // a4
    if (orientation === 'landscape') {
      pdfWidth = 297;
      pdfHeight = 210;
    } else {
      pdfWidth = 210;
      pdfHeight = 297;
    }
  }

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
    compress: true
  });

  const html2canvasCommonOptions = {
    scale: 2.0,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
    scrollX: 0,
    scrollY: 0,
    onclone: async (clonedDoc: Document) => {
      // 1. Chỉ giữ lại container in ấn trong clone DOM, ẩn triệt để toàn bộ giao diện app bên ngoài
      const targetElement = clonedDoc.getElementById(elementId);
      const printContainers = Array.from(clonedDoc.querySelectorAll<HTMLElement>('.print-layer-container'));

      // Xác định printRoot: Ưu tiên chính xác targetElement làm printRoot để khi walk-up cây DOM,
      // tất cả các phần tử sibling (ví dụ các mẫu in khác hoặc batch container khác) trong cùng container in ấn đều được ẩn triệt để
      const isInsidePrintContainer = Boolean(targetElement && printContainers.some((c) => c.contains(targetElement)));
      const printRoot = targetElement || printContainers[0];

      if (printRoot) {
        let curr: HTMLElement | null = printRoot;
        while (curr && curr !== clonedDoc.body && curr !== clonedDoc.documentElement) {
          // Bảo đảm toàn bộ cây tổ tiên của phần tử in luôn hiển thị và không bị co kéo bởi zoom preview
          curr.style.display = 'block';
          curr.style.transform = 'none';
          curr.style.position = 'static';
          curr.style.overflow = 'visible';
          curr.style.maxHeight = 'none';
          curr.style.maxWidth = 'none';

          const parent: HTMLElement | null = curr.parentElement;
          if (parent) {
            Array.from(parent.children).forEach((child) => {
              const el = child as HTMLElement;
              if (el !== curr && !el.contains(printRoot!)) {
                el.style.display = 'none';
              }
            });
          }
          curr = parent;
        }

        // Loại bỏ thêm bất kỳ phần tử sticky hoặc fixed nào không thuộc printRoot
        clonedDoc.querySelectorAll<HTMLElement>('.sticky, .fixed').forEach((el) => {
          if (!printRoot.contains(el)) {
            el.style.display = 'none';
          }
        });
      }

      if (isInsidePrintContainer) {
        printContainers.forEach((container) => {
          container.style.position = 'static';
          container.style.left = '0';
          container.style.top = '0';
          container.style.margin = '0';
          container.style.padding = '0';
          container.style.overflow = 'visible';
          container.style.pointerEvents = 'auto';
        });
      } else {
        // Khi targetElement nằm ngoài PrintLayer (ví dụ preview modal): ẩn PrintLayer để tránh xung đột
        printContainers.forEach((container) => {
          container.style.display = 'none';
        });
      }

      // 2. Đồng bộ toàn bộ CSS rules từ Document gốc sang Document clone dưới dạng thẻ <style> inline
      // Khắc phục triệt để việc Next.js nạp layout.css qua <link rel="stylesheet"> bất đồng bộ khiến iframe của html2canvas mất toàn bộ CSS Tailwind (border, flex, colgroup)
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          if (sheet.cssRules && sheet.cssRules.length > 0) {
            const styleTag = clonedDoc.createElement('style');
            let cssText = '';
            for (const rule of Array.from(sheet.cssRules)) {
              cssText += rule.cssText + '\n';
            }
            styleTag.textContent = sanitizeAllModernColors(cssText);
            clonedDoc.head.appendChild(styleTag);
          }
        } catch {
          // Bỏ qua lỗi cross-origin stylesheet (ví dụ Google Fonts link)
        }
      }

      // 3. Bơm CSS bổ trợ kiên cố cho phiếu xét nghiệm thường để đảm bảo không bị rớt viền hay co bảng
      const bulletproofStyle = clonedDoc.createElement('style');
      bulletproofStyle.textContent = `
        .header-section { display: flex !important; justify-content: space-between !important; align-items: center !important; }
        .header-section > div { display: flex !important; }
        .patient-table-section { border: 1px solid #cbd5e1 !important; border-collapse: collapse !important; }
        .patient-table-section table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
        .patient-table-section td, .patient-table-section th { border-right: 1px solid #cbd5e1 !important; border-bottom: 1px solid #cbd5e1 !important; vertical-align: middle !important; }
        #printable-medical-report table, #preview-print-element table, #batch-medical-report table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
        #printable-medical-report th, #printable-medical-report td, #preview-print-element th, #preview-print-element td, #batch-medical-report th, #batch-medical-report td { border-right: 1px solid #cbd5e1 !important; border-bottom: 1px solid #cbd5e1 !important; vertical-align: middle !important; }
      `;
      clonedDoc.head.appendChild(bulletproofStyle);

      // 4. Chờ font chữ tải và đồng bộ hoàn tất trong Document clone
      if (clonedDoc.fonts && clonedDoc.fonts.ready) {
        try {
          await clonedDoc.fonts.ready;
        } catch {
          /* ignore font ready error */
        }
      }

      // 5. Tiền xử lý màu sắc OKLCH/OKLab sang RGB trên Document clone
      sanitizeDocumentOklch(clonedDoc);
      patchWindowGetComputedStyle(clonedDoc.defaultView);

      // 6. Đảm bảo tất cả <img> SVG Data URI đã load xong trong clone DOM
      const clonedImgs = Array.from(clonedDoc.querySelectorAll('img'));
      await Promise.all(
        clonedImgs.map((img) => {
          const el = img as HTMLImageElement;
          if (el.complete && el.naturalWidth > 0) return Promise.resolve();
          if (!el.src || el.src === window.location.href) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const timer = setTimeout(() => resolve(), 2500);
            el.onload = () => { clearTimeout(timer); resolve(); };
            el.onerror = () => { clearTimeout(timer); resolve(); };
          });
        })
      );
    }
  };

  if (childPages.length > 0) {
    // -------------------------------------------------------------
    // CHẾ ĐỘ XUẤT ĐA TRANG (BOOKLET / PANEL DỊ NGUYÊN / TÁCH TRANG)
    // -------------------------------------------------------------
    const totalPages = childPages.length;
    for (let i = 0; i < totalPages; i++) {
      const pageEl = childPages[i];
      const pagePercent = Math.min(85, Math.round(15 + (i / totalPages) * 70));
      options?.onProgress?.({
        step: 'rendering_pages',
        currentPage: i + 1,
        totalPages,
        message: `Đang kết xuất đồ họa trang ${i + 1}/${totalPages} (Lossless Canvas 2.0x)...`,
        percent: pagePercent
      });
      // Nhường event loop để UI cập nhật tiến trình trang mới mượt mà
      await new Promise((resolve) => setTimeout(resolve, 20));
      let canvas = await html2canvas(pageEl, html2canvasCommonOptions);

      // Phòng thủ toàn diện: Đảm bảo canvas có kích thước hợp lệ > 0
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
        try {
          canvas = await html2canvas(pageEl, {
            scale: 2.0,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
          });
        } catch {
          /* ignore */
        }
      }

      if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
        console.warn(`[pdfService] Bỏ qua trang ${i + 1} do không render được kích thước.`);
        continue;
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || !imgData.startsWith('data:image/')) {
        console.warn(`[pdfService] Bỏ qua trang ${i + 1} do imgData không hợp lệ.`);
        continue;
      }

      if (i > 0) {
        pdf.addPage(format, orientation);
      }
      let renderWidth = pdfWidth;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;
      let renderX = 0;
      let renderY = 0;

      if (isNaN(renderHeight) || renderHeight <= 0) {
        renderHeight = pdfHeight;
      }

      // Giữ đúng tỷ lệ chuẩn của trang in, dung sai 0.5mm chống co hẹp do sai số làm tròn số học pixel -> mm
      if (renderHeight > pdfHeight + 0.5) {
        const ratio = pdfHeight / renderHeight;
        renderHeight = pdfHeight;
        renderWidth = renderWidth * ratio;
        renderX = (pdfWidth - renderWidth) / 2;
      } else {
        renderHeight = Math.min(renderHeight, pdfHeight);
      }

      try {
        pdf.addImage(imgData, 'PNG', renderX, renderY, renderWidth, renderHeight, undefined, 'FAST');
      } catch (err) {
        console.error(`[pdfService] Lỗi khi thêm ảnh vào PDF trang ${i + 1}:`, err);
      }
    }
  } else {
    // -------------------------------------------------------------
    // CHẾ ĐỘ XUẤT LIÊN TỤC (XÉT NGHIỆM THƯỜNG / PHÂN TRANG AN TOÀN)
    // -------------------------------------------------------------
    options?.onProgress?.({
      step: 'rendering_pages',
      currentPage: 1,
      totalPages: 1,
      message: 'Đang kết xuất đồ họa bản in (Lossless Canvas 2.0x)...',
      percent: 40
    });
    // Nhường event loop để UI kịp vẽ trạng thái render bản in
    await new Promise((resolve) => setTimeout(resolve, 20));
    let canvas = await html2canvas(element, html2canvasCommonOptions);

    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      try {
        canvas = await html2canvas(element, {
          scale: 2.0,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });
      } catch {
        /* ignore */
      }
    }

    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      throw new Error('Không thể render bản in từ DOM: Kích thước canvas bằng 0.');
    }

    const imgWidth = pdfWidth;
    const pageHeightInMm = pdfHeight;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeightInMm + 0.5) {
      const imgData = canvas.toDataURL('image/png', 1.0);
      if (imgData && imgData.startsWith('data:image/')) {
        try {
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeightInMm), undefined, 'FAST');
        } catch (err) {
          console.error('[pdfService] Lỗi khi thêm ảnh vào PDF:', err);
        }
      }
    } else {
      // Phân trang tự động thông minh, tránh cắt đôi dòng bảng hoặc phần tử quan trọng
      const pageCanvasHeight = (canvas.width * pageHeightInMm) / imgWidth;
      let renderedHeight = 0;
      let pageIdx = 0;

      while (renderedHeight < canvas.height) {
        const remainingCanvasHeight = canvas.height - renderedHeight;
        let currentSliceCanvasHeight = Math.min(pageCanvasHeight, remainingCanvasHeight);

        // Tránh cắt ngang dòng chữ: nếu chưa phải trang cuối, tìm điểm cắt thông minh tối ưu nhất (sát mép dưới nhất)
        if (remainingCanvasHeight > pageCanvasHeight) {
          const breakElements = Array.from(element.querySelectorAll('tr, .page-avoid-break, .break-inside-avoid, fieldset'));
          const elementRect = element.getBoundingClientRect();
          const scaleY = canvas.height / (elementRect.height || canvas.height);
          const candidateSplitY = renderedHeight + currentSliceCanvasHeight;

          let bestSplitY: number | null = null;
          for (const el of breakElements) {
            const r = el.getBoundingClientRect();
            const topY = (r.top - elementRect.top) * scaleY;
            const bottomY = (r.bottom - elementRect.top) * scaleY;
            if (topY > renderedHeight + pageCanvasHeight * 0.75 && topY < candidateSplitY && bottomY > candidateSplitY) {
              if (bestSplitY === null || topY > bestSplitY) {
                bestSplitY = topY;
              }
            }
          }
          if (bestSplitY !== null) {
            currentSliceCanvasHeight = bestSplitY - renderedHeight;
          }
        }

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
          pdf.addPage(format, orientation);
        }

        try {
          pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, currentSliceMmHeight, undefined, 'FAST');
        } catch (err) {
          console.error(`[pdfService] Lỗi khi thêm ảnh vào PDF trang ${pageIdx + 1}:`, err);
        }
        renderedHeight += currentSliceCanvasHeight;
        pageIdx++;
      }
    }
  }

  options?.onProgress?.({
    step: 'generating_pdf',
    message: 'Đang tối ưu & đóng gói tệp PDF chất lượng cao...',
    percent: 90
  });

  const blob = pdf.output('blob');
  const base64 = pdf.output('datauristring');

  return { pdf, blob, base64 };
  } finally {
    restoreMainWin();
  }
}

/**
 * Tải trực tiếp file PDF chất lượng cao về máy tính người dùng (1-Click Download)
 */
export async function downloadPdfDirectly(
  elementId: string,
  filename: string = 'PhieuKetQua.pdf',
  options?: PdfExportOptions
): Promise<Blob> {
  const res = await generateHighQualityPdf(elementId, filename, options);
  options?.onProgress?.({
    step: 'saving',
    message: 'Đang lưu tệp PDF về máy tính...',
    percent: 98
  });
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  options?.onProgress?.({
    step: 'completed',
    message: 'Tải file PDF hoàn tất!',
    percent: 100
  });
  return res.blob;
}
