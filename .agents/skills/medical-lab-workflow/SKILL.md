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
3. **Tertiary Fallback**: Local IndexedDB / Base64 Data URL cache for offline resilience.

## 4. Database & ORM (Drizzle & Postgres)
- Schema definitions located in `packages/shared` or `apps/api`.
- Always verify migrations with `npm run -w @golab/api drizzle:migrate`.
- Check database constraints using the `postgres` MCP server before altering table relations.

## 5. Quality & Build Assurance
Before finalizing any feature or refactoring:
1. `npm run typecheck` (0 TypeScript errors)
2. `npm run lint` (ESLint 9 boundaries & React 19 rules)
3. `npm run test` (Vitest unit and integration tests)
