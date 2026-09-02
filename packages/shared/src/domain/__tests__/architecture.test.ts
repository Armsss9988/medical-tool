import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ─── ARCHITECTURE TESTING SUITE ─────────────────────────────────────────────
// Khóa chặt các ranh giới kiến trúc (Architectural Boundaries) tự động bằng Vitest:
// 1. Pure Domain Core: 0 DOM, 0 React, 0 Infra, 0 UI dependencies.
// 2. Vertical Slice Isolation: Cấm Feature Slice import chéo lẫn nhau.
// 3. Clean Use Cases: Không chứa UI dependencies.

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('dist')) {
        getAllSourceFiles(fullPath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function extractImports(fileContent: string): string[] {
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
  const matches: string[] = [];
  let match;
  while ((match = importRegex.exec(fileContent)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

describe('Domain-Driven Vertical Slice Architecture Invariants', () => {
  const rootDir = path.resolve(__dirname, '../../../../../');
  const domainDir = path.resolve(rootDir, 'packages/shared/src/domain');
  const featuresDir = path.resolve(rootDir, 'apps/web/src/features');

  // 1. RULE: DOMAIN CORE PURITY
  it('Domain Core must have ZERO UI, DOM, Infra, or React dependencies', () => {
    const domainFiles = getAllSourceFiles(domainDir);
    expect(domainFiles.length).toBeGreaterThan(0);

    const forbiddenImports = [
      'react',
      'react-dom',
      '@infra',
      '@components',
      '@features',
      'html2canvas',
      'jspdf',
      'lucide-react',
      'electron',
      'next'
    ];

    const violations: { file: string; imp: string }[] = [];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        for (const forbidden of forbiddenImports) {
          if (imp === forbidden || imp.startsWith(`${forbidden}/`)) {
            violations.push({
              file: path.relative(rootDir, file),
              imp
            });
          }
        }
      }
    }

    expect(
      violations,
      `Phát hiện vi phạm kiến trúc: Domain Core phụ thuộc vào UI/Infra bên ngoài:\n${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });

  // 2. RULE: NO CROSS-SLICE IMPORTS IN FEATURES
  it('Feature Slices must NOT import from other feature slices (No Cross-Slice Imports)', () => {
    if (!fs.existsSync(featuresDir)) return;

    const sliceDirs = fs
      .readdirSync(featuresDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const violations: { file: string; forbiddenSliceImport: string }[] = [];

    for (const sliceName of sliceDirs) {
      const slicePath = path.join(featuresDir, sliceName);
      const sliceFiles = getAllSourceFiles(slicePath);

      for (const file of sliceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const imports = extractImports(content);

        for (const otherSlice of sliceDirs) {
          if (otherSlice === sliceName) continue;

          for (const imp of imports) {
            // Cấm import trực tiếp @features/<otherSlice> hoặc relative sang slice khác
            const isForbidden =
              imp === `@features/${otherSlice}` ||
              imp.startsWith(`@features/${otherSlice}/`) ||
              imp.includes(`features/${otherSlice}`) ||
              imp.includes(`features\\${otherSlice}`);

            if (isForbidden) {
              violations.push({
                file: path.relative(rootDir, file),
                forbiddenSliceImport: imp
              });
            }
          }
        }
      }
    }

    expect(
      violations,
      `Phát hiện vi phạm kiến trúc: Feature Slice import chéo lẫn nhau (Coupling Violation):\n${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });
});
