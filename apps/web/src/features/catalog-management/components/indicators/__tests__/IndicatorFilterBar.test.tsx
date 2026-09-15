// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { IndicatorFilterBar, IndicatorFilterBarProps } from '../IndicatorFilterBar';
import { TestGroup, TestEquipment } from '@domain/types';

describe('IndicatorFilterBar', () => {
  afterEach(() => {
    cleanup();
  });

  const mockGroups: TestGroup[] = [
    { id: 'grp_sh', name: 'Sinh Hóa' },
    { id: 'grp_hh', name: 'Huyết Học' }
  ];

  const mockEquipments: TestEquipment[] = [
    { id: 'eq_cobas', name: 'Cobas c311', code: 'COBAS' },
    { id: 'eq_sysmex', name: 'Sysmex XN-550', code: 'SYSMEX' }
  ];

  const defaultProps: IndicatorFilterBarProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    selectedGroup: 'all',
    onGroupChange: vi.fn(),
    groups: mockGroups,
    viewFilter: 'all',
    onViewFilterChange: vi.fn(),
    totalCount: 150,
    generalCount: 120,
    allergenCount: 30,
    filteredCount: 150,
    isQuickEditMode: false,
    onToggleQuickEditMode: vi.fn(),
    onAddNew: vi.fn(),
    onExportExcel: vi.fn(),
    onImportExcel: vi.fn(),
    onDownloadTemplate: vi.fn(),
    equipments: mockEquipments,
    equipmentFilter: 'all',
    onEquipmentFilterChange: vi.fn(),
    evalTypeFilter: 'all',
    onEvalTypeFilterChange: vi.fn(),
    refRangeFilter: 'all',
    onRefRangeFilterChange: vi.fn(),
    priceFilter: 'all',
    onPriceFilterChange: vi.fn(),
    sortBy: 'default',
    onSortByChange: vi.fn(),
    showAdvancedFilters: false,
    onToggleAdvancedFilters: vi.fn(),
    onResetFilters: vi.fn(),
    activeFilterCount: 0
  };

  it('renders search input, view filter pills, and counters correctly', () => {
    render(<IndicatorFilterBar {...defaultProps} />);

    expect(screen.getByPlaceholderText(/Tìm mã, tên chỉ số/i)).toBeDefined();
    expect(screen.getByText('Tất cả (150)')).toBeDefined();
    expect(screen.getByText('Thường (120)')).toBeDefined();
    expect(screen.getByText('Dị nguyên (30)')).toBeDefined();
    expect(screen.getByText('150')).toBeDefined();
  });

  it('triggers onSearchChange when typing in search input', () => {
    const onSearchChange = vi.fn();
    render(<IndicatorFilterBar {...defaultProps} onSearchChange={onSearchChange} />);

    const input = screen.getByPlaceholderText(/Tìm mã, tên chỉ số/i);
    fireEvent.change(input, { target: { value: 'GLU' } });

    expect(onSearchChange).toHaveBeenCalledWith('GLU');
  });

  it('toggles advanced filters when clicking the filter button', () => {
    const onToggleAdvancedFilters = vi.fn();
    render(<IndicatorFilterBar {...defaultProps} onToggleAdvancedFilters={onToggleAdvancedFilters} />);

    const filterBtn = screen.getByRole('button', { name: /Bộ Lọc/i });
    fireEvent.click(filterBtn);

    expect(onToggleAdvancedFilters).toHaveBeenCalledTimes(1);
  });

  it('renders advanced filter controls when showAdvancedFilters is true', () => {
    const onEquipmentFilterChange = vi.fn();
    const onEvalTypeFilterChange = vi.fn();
    const onRefRangeFilterChange = vi.fn();
    const onPriceFilterChange = vi.fn();
    const onSortByChange = vi.fn();

    render(
      <IndicatorFilterBar
        {...defaultProps}
        showAdvancedFilters={true}
        onEquipmentFilterChange={onEquipmentFilterChange}
        onEvalTypeFilterChange={onEvalTypeFilterChange}
        onRefRangeFilterChange={onRefRangeFilterChange}
        onPriceFilterChange={onPriceFilterChange}
        onSortByChange={onSortByChange}
      />
    );

    // Kiểm tra dropdown thiết bị
    const equipmentSelect = screen.getByTitle(/Lọc theo thiết bị đo/i);
    fireEvent.change(equipmentSelect, { target: { value: 'has_equipment' } });
    expect(onEquipmentFilterChange).toHaveBeenCalledWith('has_equipment');

    // Kiểm tra dropdown kiểu đánh giá
    const evalSelect = screen.getByTitle(/Lọc theo phương pháp đánh giá kết quả/i);
    fireEvent.change(evalSelect, { target: { value: 'range' } });
    expect(onEvalTypeFilterChange).toHaveBeenCalledWith('range');

    // Kiểm tra dropdown tham chiếu
    const refSelect = screen.getByTitle(/Lọc chỉ số đã có hoặc còn thiếu/i);
    fireEvent.change(refSelect, { target: { value: 'missing' } });
    expect(onRefRangeFilterChange).toHaveBeenCalledWith('missing');

    // Kiểm tra dropdown đơn giá
    const priceSelect = screen.getByTitle(/Lọc theo đơn giá xét nghiệm/i);
    fireEvent.change(priceSelect, { target: { value: 'paid' } });
    expect(onPriceFilterChange).toHaveBeenCalledWith('paid');

    // Kiểm tra dropdown sắp xếp
    const sortSelect = screen.getByTitle(/Sắp xếp danh mục chỉ số/i);
    fireEvent.change(sortSelect, { target: { value: 'name_asc' } });
    expect(onSortByChange).toHaveBeenCalledWith('name_asc');
  });

  it('renders active filter chips and resets filters', () => {
    const onResetFilters = vi.fn();
    const onGroupChange = vi.fn();
    const onEquipmentFilterChange = vi.fn();

    render(
      <IndicatorFilterBar
        {...defaultProps}
        selectedGroup="Sinh Hóa"
        equipmentFilter="has_equipment"
        activeFilterCount={2}
        filteredCount={45}
        onResetFilters={onResetFilters}
        onGroupChange={onGroupChange}
        onEquipmentFilterChange={onEquipmentFilterChange}
      />
    );

    expect(screen.getByText(/Nhóm: Sinh Hóa/i)).toBeDefined();
    expect(screen.getByText(/Máy: Đã gán máy/i)).toBeDefined();
    expect(screen.getByText('45')).toBeDefined();

    // Click "Xóa tất cả (2)"
    const resetAllBtn = screen.getByText(/Xóa tất cả \(2\)/i);
    fireEvent.click(resetAllBtn);
    expect(onResetFilters).toHaveBeenCalledTimes(1);

    // Bỏ lẻ filter nhóm
    const removeGroupBtn = screen.getByTitle('Bỏ lọc nhóm');
    fireEvent.click(removeGroupBtn);
    expect(onGroupChange).toHaveBeenCalledWith('all');

    // Bỏ lẻ filter máy
    const removeEquipBtn = screen.getByTitle('Bỏ lọc máy đo');
    fireEvent.click(removeEquipBtn);
    expect(onEquipmentFilterChange).toHaveBeenCalledWith('all');
  });
});
