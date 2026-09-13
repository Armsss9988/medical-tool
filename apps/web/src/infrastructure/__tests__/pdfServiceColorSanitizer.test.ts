import { describe, it, expect } from 'vitest';
import {
  sanitizeAllModernColors,
  oklchToRgb,
  sanitizeDocumentOklch,
  patchWindowGetComputedStyle
} from '../pdfService';

describe('pdfService Modern Color Sanitization Engine', () => {
  it('converts simple oklab to valid rgb', () => {
    const input = 'color: oklab(0.6 0.1 -0.1);';
    const result = sanitizeAllModernColors(input);
    expect(result).not.toContain('oklab');
    expect(result).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
  });

  it('converts oklab with alpha to valid rgba', () => {
    const input = 'background-color: oklab(0.5 0.05 0.05 / 0.5);';
    const result = sanitizeAllModernColors(input);
    expect(result).not.toContain('oklab');
    expect(result).toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*0\.5\)/);
  });

  it('converts oklch to valid rgb', () => {
    const input = 'border-color: oklch(0.65 0.18 135);';
    const result = sanitizeAllModernColors(input);
    expect(result).not.toContain('oklch');
    expect(result).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
  });

  it('converts color-mix with in oklab and nested parentheses properly', () => {
    const input = 'color: color-mix(in oklab, var(--color-emerald-500) 20%, transparent);';
    const result = sanitizeAllModernColors(input);
    expect(result).not.toContain('color-mix');
    expect(result).not.toContain('oklab');
    expect(result).toContain('rgb(');
  });

  it('converts multiple modern colors in complex stylesheet text without leaving oklab behind', () => {
    const cssText = `
      .badge-test {
        background-color: color-mix(in oklab, var(--color-teal-600) 15%, transparent);
        color: oklab(0.4 0.12 -0.05);
        border: 1px solid oklch(0.7 0.1 200 / 0.8);
      }
    `;
    const result = sanitizeAllModernColors(cssText);
    expect(result).not.toContain('oklab');
    expect(result).not.toContain('oklch');
    expect(result).not.toContain('color-mix');
    expect(result).toContain('rgb');
  });

  it('preserves oklchToRgb backward compatibility', () => {
    const input = 'oklch(0.7 0.2 120)';
    const res = oklchToRgb(input);
    expect(res).not.toContain('oklch');
    expect(res).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
  });

  it('sanitizes <style> tags and inline styles on DOM elements', () => {
    const container = document.createElement('div');
    const styleEl = document.createElement('style');
    styleEl.textContent = '.box { background: oklab(0.7 0.1 0.1); }';
    container.appendChild(styleEl);

    const child = document.createElement('div');
    child.setAttribute('style', 'color: oklab(0.5 0.1 -0.1);');
    container.appendChild(child);

    sanitizeDocumentOklch(container);

    expect(styleEl.textContent).not.toContain('oklab');
    expect(child.getAttribute('style')).not.toContain('oklab');
  });

  it('patches getComputedStyle without throwing Illegal invocation and intercepts modern colors', () => {
    const el = document.createElement('div');
    el.style.backgroundColor = 'oklab(0.5 0.1 -0.1)';
    document.body.appendChild(el);

    const restore = patchWindowGetComputedStyle(window);
    try {
      const comp = window.getComputedStyle(el);
      // Đảm bảo truy cập thuộc tính và phương thức không quăng lỗi TypeError: Illegal invocation
      expect(() => comp.backgroundColor).not.toThrow();
      expect(() => comp.getPropertyValue('background-color')).not.toThrow();

      // Kiểm tra nếu giá trị trả về có oklab thì đã được khử thành rgb/rgba
      const bg = comp.backgroundColor;
      if (bg) {
        expect(bg).not.toContain('oklab');
      }
    } finally {
      restore();
      document.body.removeChild(el);
    }
  });
});
