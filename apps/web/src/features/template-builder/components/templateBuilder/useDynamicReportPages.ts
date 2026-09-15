import { useMemo } from 'react';
import {
  TemplateBlock,
  ReportPaginationDomainService,
  ReportPaginationEntry,
  SelectedTest,
  AllergenDetailTableBlockProps
} from '@domain';
import { AllergenReportItemDTO, AllergenReportDTO } from '@domain/services/AllergenReportDomainService';

export interface RenderedReportPage {
  pageNumber: number;
  blocks: TemplateBlock[];
  isContinuation?: boolean;
  tableChunkEntries?: ReadonlyArray<ReportPaginationEntry>;
  showConclusionOverride?: boolean;
  showSignatureOverride?: boolean;
  allergenTableChunkEntries?: AllergenReportItemDTO[];
  allergenChunkInfo?: { pageIdx: number; totalDetailPages: number; totalCount: number };
}

interface UseDynamicReportPagesOptions {
  sortedBlocks: TemplateBlock[];
  isDesignMode: boolean;
  isBlockVisible: (block: TemplateBlock) => boolean;
  regularTests: SelectedTest[];
  allergenDTO: AllergenReportDTO | null;
  conclusion?: string;
}

export function useDynamicReportPages({
  sortedBlocks,
  isDesignMode,
  isBlockVisible,
  regularTests,
  allergenDTO,
  conclusion
}: UseDynamicReportPagesOptions): RenderedReportPage[] {
  // Chia các block thành các trang cơ sở dựa trên `page_break` thủ công
  const baseTemplatePages = useMemo(() => {
    const pageList: TemplateBlock[][] = [[]];
    for (const b of sortedBlocks) {
      if (b.type === 'page_break') {
        if (isDesignMode) {
          // Trong design mode: giữ block page_break để có thể chọn, kéo thả, di chuyển
          pageList[pageList.length - 1].push(b);
        }
        pageList.push([]);
      } else {
        if (isDesignMode || isBlockVisible(b)) {
          pageList[pageList.length - 1].push(b);
        }
      }
    }
    return pageList.filter((p) => {
      if (isDesignMode) return p.length > 0;
      return p.some((b) => b.type !== 'page_break' && isBlockVisible(b));
    });
  }, [sortedBlocks, isDesignMode, isBlockVisible]);

  // Phân trang thông minh: Tự động ngắt trang chuẩn A4 khi danh sách xét nghiệm dài
  const renderedPages = useMemo(() => {
    if (isDesignMode) {
      return baseTemplatePages.map((blocks, idx) => ({
        pageNumber: idx + 1,
        blocks,
        isContinuation: false,
        tableChunkEntries: undefined,
        showConclusionOverride: undefined,
        showSignatureOverride: undefined,
        allergenTableChunkEntries: undefined,
        allergenChunkInfo: undefined
      }));
    }

    const result: RenderedReportPage[] = [];
    let currentPageNum = 1;

    for (const templatePageBlocks of baseTemplatePages) {
      const hasTestTable = templatePageBlocks.some((b) => b.type === 'test_table');
      const hasAllergenDetail = templatePageBlocks.some(
        (b) => b.type === 'allergen_detail_table' || b.type === 'allergen_detail'
      );

      if (hasTestTable && regularTests.length > 0) {
        // Có khối test_table: dùng ReportPaginationDomainService để phân trang thông minh
        const hasHeader = templatePageBlocks.some((b) => b.type === 'header' || b.type === 'patient_info');
        const paginatedChunks = ReportPaginationDomainService.paginate(
          regularTests,
          conclusion,
          {
            page1StaticHeight: hasHeader ? 328 : 90
          }
        );

        if (paginatedChunks.length <= 1) {
          // Vừa vặn trên 1 trang duy nhất
          result.push({
            pageNumber: currentPageNum++,
            blocks: templatePageBlocks,
            tableChunkEntries: paginatedChunks[0]?.entries
          });
        } else {
          // Cần ngắt thành nhiều trang
          const tableIdx = templatePageBlocks.findIndex((b) => b.type === 'test_table');
          const blocksBeforeTable = templatePageBlocks.slice(0, tableIdx);
          const testTableBlock = templatePageBlocks[tableIdx];
          const blocksAfterTable = templatePageBlocks.slice(tableIdx + 1);

          for (let chunkIdx = 0; chunkIdx < paginatedChunks.length; chunkIdx++) {
            const chunk = paginatedChunks[chunkIdx];
            const isFirstChunk = chunkIdx === 0;
            const isLastChunk = chunk.isLastPage;

            if (isFirstChunk) {
              // Trang đầu tiên: Các block trước bảng + Bảng (chunk 1)
              const firstPageBlocks = [...blocksBeforeTable, testTableBlock];
              if (isLastChunk) {
                firstPageBlocks.push(...blocksAfterTable);
              }
              result.push({
                pageNumber: currentPageNum++,
                blocks: firstPageBlocks,
                isContinuation: false,
                tableChunkEntries: chunk.entries,
                showConclusionOverride: chunk.showConclusion,
                showSignatureOverride: chunk.showSignature
              });
            } else {
              // Các trang tiếp theo: Mini Header + Bảng (chunk tiếp theo)
              const continuationBlocks = [testTableBlock];
              if (isLastChunk) {
                continuationBlocks.push(...blocksAfterTable);
              }
              result.push({
                pageNumber: currentPageNum++,
                blocks: continuationBlocks,
                isContinuation: true,
                tableChunkEntries: chunk.entries,
                showConclusionOverride: chunk.showConclusion,
                showSignatureOverride: chunk.showSignature
              });
            }
          }
        }
        continue;
      }

      if (hasAllergenDetail && allergenDTO && allergenDTO.detailedList.length > 0) {
        const detailBlock = templatePageBlocks.find(
          (b) => b.type === 'allergen_detail_table' || b.type === 'allergen_detail'
        )!;
        const p = detailBlock.props as AllergenDetailTableBlockProps;
        const itemsPerPage = p?.itemsPerPage || 14;
        const detailedList = allergenDTO.detailedList;

        const chunks: AllergenReportItemDTO[][] = [];
        for (let i = 0; i < detailedList.length; i += itemsPerPage) {
          chunks.push(detailedList.slice(i, i + itemsPerPage));
        }
        if (chunks.length === 0) chunks.push([]);

        if (chunks.length <= 1) {
          result.push({
            pageNumber: currentPageNum++,
            blocks: templatePageBlocks,
            allergenTableChunkEntries: chunks[0],
            allergenChunkInfo: {
              pageIdx: 0,
              totalDetailPages: 1,
              totalCount: detailedList.length
            }
          });
        } else {
          const tableIdx = templatePageBlocks.findIndex(
            (b) => b.type === 'allergen_detail_table' || b.type === 'allergen_detail'
          );
          const blocksBeforeTable = templatePageBlocks.slice(0, tableIdx);
          const blocksAfterTable = templatePageBlocks.slice(tableIdx + 1);

          for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
            const isFirstChunk = chunkIdx === 0;
            const chunk = chunks[chunkIdx];

            if (isFirstChunk) {
              result.push({
                pageNumber: currentPageNum++,
                blocks: [...blocksBeforeTable, detailBlock],
                isContinuation: false,
                allergenTableChunkEntries: chunk,
                allergenChunkInfo: {
                  pageIdx: chunkIdx,
                  totalDetailPages: chunks.length,
                  totalCount: detailedList.length
                }
              });
            } else {
              result.push({
                pageNumber: currentPageNum++,
                blocks: [detailBlock],
                isContinuation: true,
                allergenTableChunkEntries: chunk,
                allergenChunkInfo: {
                  pageIdx: chunkIdx,
                  totalDetailPages: chunks.length,
                  totalCount: detailedList.length
                }
              });
            }
          }

          if (blocksAfterTable.length > 0) {
            result.push({
              pageNumber: currentPageNum++,
              blocks: blocksAfterTable,
              isContinuation: true
            });
          }
        }
        continue;
      }

      result.push({
        pageNumber: currentPageNum++,
        blocks: templatePageBlocks
      });
    }

    return result;
  }, [baseTemplatePages, isDesignMode, regularTests, allergenDTO, conclusion]);

  return renderedPages;
}
