---
name: medical-lab-workflow
description: Domain guidelines, PDF export standards, database schema workflows, and testing procedures for GoLab Medical Tool.
---

# GoLab Medical Tool - Domain & Workflow Guide

## 1. Domain Overview & Medical Standards
GoLab Medical Tool is a laboratory information management system (LIS) managing:
- 130+ clinical test indicators & reference ranges (Nam, Nữ, Trẻ em).
- 91 PROTIA IgE allergy indicators grouped by clinical categories (Inhalant, Food, Pollen, etc.).
- Patient demographics, specimen IDs, barcodes, QR codes, and invoice revenue.

## 2. A4 Medical PDF Export Rules (Strict)
- **Color Accuracy**: Convert all modern OKLCH CSS colors to standard sRGB via `oklchToRgb` before feeding to `html2canvas` / `jsPDF`.
- **Lossless Rendering**: Use Lossless PNG canvas rasterization to ensure test results and table borders are crisp at 300 DPI.
- **Patient Header Table**: Keep exact 12-field grid layout (6 rows, 4 columns). Patient Name and Specimen Number must be bold red.
- **Multi-page IgE Allergen Lists**: Ensure table pagination doesn't clip allergen indicators or intensity classes.

## 3. Data Storage & 3-Tier Fallback
1. **Primary**: Supabase Storage (`medical-reports` bucket).
2. **Secondary Fallback**: Cloudinary unsigned upload preset.
3. **Tertiary Fallback**: Local Base64 Data URL cache for emergency in-browser preview.

## 4. Database & ORM (Drizzle & Postgres)
- Schema definitions located in `packages/shared` or `apps/api`.
- Always verify migrations with `npm run -w @golab/api drizzle:migrate`.
- Check database constraints using the `postgres` MCP server before altering table relations.

## 5. Architecture: Domain-Driven Vertical Slice Architecture (VSA)
GoLab strictly enforces VSA over a Pure Rich Domain Core:
- **Domain Core (`packages/shared/src/domain`)**: Pure TypeScript, 0 DOM/React/external API dependencies. Mathematical calculations, pricing, and auto-conclusion live here.
- **Feature Slices (`apps/web/src/features/*`)**: Self-contained slices (`lab-testing`, `report-export`, `billing-revenue`). **No Cross-Slice Imports** allowed.
- See detailed rules in [Domain Vertical Slice Architecture Skill](../domain-vertical-slice-architecture/SKILL.md).

## 6. Quality & Build Assurance
Before finalizing any feature, fix, or refactoring:
1. `npm run typecheck` (0 TypeScript compile errors)
2. `npm run lint` (ESLint 9 architectural boundaries & React rules)
3. `npm run test` (Vitest unit and integration tests, all pass)
4. `npm run build` (Next.js production build passes)

