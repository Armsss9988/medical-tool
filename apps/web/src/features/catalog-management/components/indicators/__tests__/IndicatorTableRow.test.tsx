// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { IndicatorTableRow } from '../IndicatorTableRow';
import { CatalogItem, TestEquipment, TestGroup, CatalogItemEquipmentLink } from '@domain/types';

describe('IndicatorTableRow', () => {
  afterEach(() => {
    cleanup();
  });
  const mockItem: CatalogItem = {
    code: 'GLU',
    name: 'Glucose Máu',
    scientific: 'Blood Glucose',
    category: 'Sinh Hóa',
    unit: 'mmol/L',
    refMin: 3.9,
    refMax: 6.4,
    refText: '3.9 - 6.4',
    price: 35000,
    evaluationType: 'range',
    equipment: 'MS-360'
  };

  const mockGroups: TestGroup[] = [
    { id: 'grp_sh', name: 'Sinh Hóa' },
    { id: 'grp_hh', name: 'Huyết Học' }
  ];

  const mockEquipments: TestEquipment[] = [
    { id: 'eq_ms360', name: 'MS-360', code: 'MS-360' },
    { id: 'eq_cobas', name: 'Cobas c501', code: 'COBAS' }
  ];

  const mockLinks: CatalogItemEquipmentLink[] = [
    {
      id: 'cie_glu_ms360',
      catalogCode: 'GLU',
      equipmentId: 'eq_ms360',
      refMin: 3.9,
      refMax: 6.4,
      unit: 'mmol/L',
      refText: '3.9 - 6.4',
      isDefault: true
    }
  ];

  it('renders indicator data in normal mode and triggers onEdit on double click', () => {
    const onEdit = vi.fn();
    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={mockItem}
            linkedCount={1}
            isQuickEditMode={false}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={mockLinks}
            onEdit={onEdit}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('GLU')).toBeTruthy();
    expect(screen.getByText('Glucose Máu')).toBeTruthy();
    expect(screen.getByText('mmol/L')).toBeTruthy();
    expect(screen.getByText('3.9 - 6.4')).toBeTruthy();
    expect(screen.getByText('35.000 đ')).toBeTruthy();

    const row = screen.getByText('GLU').closest('tr');
    expect(row).toBeTruthy();
    fireEvent.doubleClick(row!);
    expect(onEdit).toHaveBeenCalledWith(mockItem);
  });

  it('prevents onEdit on double click when isQuickEditMode is true', () => {
    const onEdit = vi.fn();
    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={mockItem}
            linkedCount={1}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={mockLinks}
            onEdit={onEdit}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>
    );

    const row = screen.getByText('GLU').closest('tr');
    fireEvent.doubleClick(row!);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('allows quick editing name and category', () => {
    const onQuickUpdate = vi.fn();
    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={mockItem}
            linkedCount={1}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={mockLinks}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onQuickUpdate={onQuickUpdate}
          />
        </tbody>
      </table>
    );

    const nameInput = screen.getByDisplayValue('Glucose Máu');
    fireEvent.change(nameInput, { target: { value: 'Glucose Đói' } });
    expect(onQuickUpdate).toHaveBeenCalledWith('GLU', { name: 'Glucose Đói' });

    const categorySelect = screen.getByTitle('Đổi nhanh nhóm chỉ số');
    fireEvent.change(categorySelect, { target: { value: 'Huyết Học' } });
    expect(onQuickUpdate).toHaveBeenCalledWith('GLU', { category: 'Huyết Học' });
  });

  it('allows quick editing refMin and refMax, calculating refText', () => {
    const onQuickUpdate = vi.fn();
    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={mockItem}
            linkedCount={1}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={mockLinks}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onQuickUpdate={onQuickUpdate}
          />
        </tbody>
      </table>
    );

    const minInput = screen.getByPlaceholderText('Min');
    fireEvent.change(minInput, { target: { value: '4.1' } });
    expect(onQuickUpdate).toHaveBeenCalledWith('GLU', {
      refMin: 4.1,
      refText: '4.1 - 6.4',
      evaluationType: 'range'
    });

    const maxInput = screen.getByPlaceholderText('Max');
    fireEvent.change(maxInput, { target: { value: '7.0' } });
    expect(onQuickUpdate).toHaveBeenCalledWith('GLU', {
      refMax: 7.0,
      refText: '3.9 - 7',
      evaluationType: 'range'
    });
  });

  it('allows toggling between range and text reference modes', () => {
    const onQuickUpdate = vi.fn();
    const { rerender } = render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={mockItem}
            linkedCount={1}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={mockLinks}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onQuickUpdate={onQuickUpdate}
          />
        </tbody>
      </table>
    );

    const toggleToTextBtn = screen.getByTitle('Chuyển sang tham chiếu định tính (Text)');
    fireEvent.click(toggleToTextBtn);
    expect(onQuickUpdate).toHaveBeenCalledWith('GLU', { evaluationType: 'text' });

    // Rerender with text evaluation mode
    rerender(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={{ ...mockItem, evaluationType: 'text', refMin: null, refMax: null, refText: 'Âm tính' }}
            linkedCount={1}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={mockLinks}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onQuickUpdate={onQuickUpdate}
          />
        </tbody>
      </table>
    );

    const textInput = screen.getByPlaceholderText('Tham chiếu text (VD: Âm tính)');
    expect(textInput).toBeTruthy();
    fireEvent.change(textInput, { target: { value: 'Bình thường' } });
    expect(onQuickUpdate).toHaveBeenCalledWith('GLU', {
      refText: 'Bình thường',
      evaluationType: 'text'
    });

    const toggleToRangeBtn = screen.getByTitle('Chuyển sang dải số Min - Max');
    fireEvent.click(toggleToRangeBtn);
    expect(onQuickUpdate).toHaveBeenCalledWith('GLU', { evaluationType: 'range' });
  });

  it('resolves equipment from catalogItemEquipments default link and calls onQuickUpdateEquipment', () => {
    const onQuickUpdateEquipment = vi.fn();
    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={mockItem}
            linkedCount={1}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={mockLinks}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onQuickUpdateEquipment={onQuickUpdateEquipment}
          />
        </tbody>
      </table>
    );

    const equipSelect = screen.getByTitle('Đổi nhanh máy đo gán mặc định') as HTMLSelectElement;
    expect(equipSelect.value).toBe('eq_ms360');

    fireEvent.change(equipSelect, { target: { value: 'eq_cobas' } });
    expect(onQuickUpdateEquipment).toHaveBeenCalledWith('GLU', 'eq_cobas');
  });

  it('renders scale badge without corrupting numeric inputs for allergen scales', () => {
    const allergenItem: CatalogItem = {
      code: 'd1',
      name: 'Dermatophagoides pteronyssinus',
      category: 'Dị Nguyên Bụi',
      unit: 'IU/mL',
      refMin: 0,
      refMax: 0.34,
      refText: '< 0.34 (Độ 0)',
      evaluationType: 'scale',
      scaleId: 'scale_protia_91'
    };

    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={allergenItem}
            linkedCount={1}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('< 0.34 (Độ 0)')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Min')).toBeNull();
    expect(screen.queryByPlaceholderText('Max')).toBeNull();
  });

  it('supports multi-device selector pills and directs quick edit to the active device link', () => {
    const onUpdateEquipmentLink = vi.fn();
    const multiLinks: CatalogItemEquipmentLink[] = [
      {
        id: 'link_ms360',
        catalogCode: 'GLU',
        equipmentId: 'eq_ms360',
        refMin: 3.9,
        refMax: 6.4,
        unit: 'mmol/L',
        refText: '3.9 - 6.4',
        isDefault: true
      },
      {
        id: 'link_cobas',
        catalogCode: 'GLU',
        equipmentId: 'eq_cobas',
        refMin: 70,
        refMax: 115,
        unit: 'mg/dL',
        refText: '70 - 115',
        isDefault: false
      }
    ];

    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={mockItem}
            linkedCount={2}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={multiLinks}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onUpdateEquipmentLink={onUpdateEquipmentLink}
          />
        </tbody>
      </table>
    );

    // Initial state: default machine MS-360 is active
    expect(screen.getByDisplayValue('mmol/L')).toBeTruthy();
    expect(screen.getByDisplayValue('3.9')).toBeTruthy();
    expect(screen.getByDisplayValue('6.4')).toBeTruthy();

    // Click Cobas pill to switch active machine
    const cobasPill = screen.getByRole('button', { name: /COBAS/i });
    fireEvent.click(cobasPill);

    // Now input fields reflect Cobas unit (mg/dL) and range (70 - 115)
    expect(screen.getByDisplayValue('mg/dL')).toBeTruthy();
    expect(screen.getByDisplayValue('70')).toBeTruthy();
    expect(screen.getByDisplayValue('115')).toBeTruthy();

    // Editing unit should call onUpdateEquipmentLink with link_cobas
    const unitInput = screen.getByDisplayValue('mg/dL');
    fireEvent.change(unitInput, { target: { value: 'g/L' } });
    expect(onUpdateEquipmentLink).toHaveBeenCalledWith('link_cobas', { unit: 'g/L' });

    // Editing min should call onUpdateEquipmentLink with link_cobas
    const minInput = screen.getByDisplayValue('70');
    fireEvent.change(minInput, { target: { value: '75' } });
    expect(onUpdateEquipmentLink).toHaveBeenCalledWith('link_cobas', { refMin: 75, refText: '75 - 115' });
  });

  it('toggles sub-row expansion and handles equipment link actions (set default, remove, add)', () => {
    const onUpdateEquipmentLink = vi.fn();
    const onSetDefaultEquipmentLink = vi.fn();
    const onRemoveEquipmentLink = vi.fn();
    const onAddEquipmentLink = vi.fn();

    const multiLinks: CatalogItemEquipmentLink[] = [
      {
        id: 'link_ms360',
        catalogCode: 'GLU',
        equipmentId: 'eq_ms360',
        refMin: 3.9,
        refMax: 6.4,
        unit: 'mmol/L',
        refText: '3.9 - 6.4',
        isDefault: true
      },
      {
        id: 'link_cobas',
        catalogCode: 'GLU',
        equipmentId: 'eq_cobas',
        refMin: 70,
        refMax: 115,
        unit: 'mg/dL',
        refText: '70 - 115',
        isDefault: false
      }
    ];

    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={mockItem}
            linkedCount={2}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={multiLinks}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onUpdateEquipmentLink={onUpdateEquipmentLink}
            onSetDefaultEquipmentLink={onSetDefaultEquipmentLink}
            onRemoveEquipmentLink={onRemoveEquipmentLink}
            onAddEquipmentLink={onAddEquipmentLink}
          />
        </tbody>
      </table>
    );

    // Expand sub-row
    const expandBtn = screen.getByTitle('Mở rộng chi tiết từng máy đo');
    fireEvent.click(expandBtn);

    // Verify sub-row is visible
    expect(screen.getByText(/Cấu Hình Dải Tham Chiếu Từng Máy Đo/i)).toBeTruthy();

    // In sub-row: test "Đặt làm mặc định" for Cobas
    const setDefaultBtn = screen.getByText('Đặt làm mặc định');
    fireEvent.click(setDefaultBtn);
    expect(onSetDefaultEquipmentLink).toHaveBeenCalledWith('GLU', 'link_cobas');

    // In sub-row: test remove Cobas machine
    const deleteButtons = screen.getAllByTitle('Gỡ máy đo này khỏi chỉ số');
    expect(deleteButtons.length).toBe(2);
    fireEvent.click(deleteButtons[1]);
    expect(onRemoveEquipmentLink).toHaveBeenCalledWith('link_cobas');

    // Test collapse button
    const collapseBtn = screen.getByText('Thu gọn');
    fireEvent.click(collapseBtn);
    expect(screen.queryByText(/Cấu Hình Dải Tham Chiếu Từng Máy Đo/i)).toBeNull();
  });

  it('allows adding a new equipment when indicator has no linked equipment', () => {
    const onAddEquipmentLink = vi.fn();
    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={{ ...mockItem, equipment: undefined }}
            linkedCount={0}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={[]}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onAddEquipmentLink={onAddEquipmentLink}
          />
        </tbody>
      </table>
    );

    const select = screen.getByTitle('Gán máy đo cho chỉ số này');
    fireEvent.change(select, { target: { value: 'eq_ms360' } });
    expect(onAddEquipmentLink).toHaveBeenCalledWith('GLU', 'eq_ms360');
  });

  it('renders detection badge and allows quick-editing custom refText for detection indicators', () => {
    const detectionItem: CatalogItem = {
      code: 'HPV',
      name: 'HPV DNA Realtime PCR',
      category: 'Sinh Học Phân Tử',
      unit: 'Copies/mL',
      refText: 'Âm tính',
      price: 450000,
      evaluationType: 'detection'
    };

    const { rerender } = render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={detectionItem}
            linkedCount={0}
            isQuickEditMode={false}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={[]}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>
    );

    // Normal mode: should display "Phát Hiện" badge and custom refText "Âm tính"
    expect(screen.getByText('Phát Hiện')).toBeTruthy();
    expect(screen.getByText('Âm tính')).toBeTruthy();

    // Quick edit mode: should render custom refText input
    const onQuickUpdate = vi.fn();
    rerender(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={detectionItem}
            linkedCount={0}
            isQuickEditMode={true}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={[]}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
            onQuickUpdate={onQuickUpdate}
          />
        </tbody>
      </table>
    );

    const refInput = screen.getByTitle('Sửa tham chiếu hiển thị cho chỉ số phát hiện (Lựa chọn C)');
    expect(refInput).toBeTruthy();
    expect((refInput as HTMLInputElement).value).toBe('Âm tính');

    fireEvent.change(refInput, { target: { value: 'Không Phát Hiện' } });
    expect(onQuickUpdate).toHaveBeenCalledWith('HPV', { refText: 'Không Phát Hiện', evaluationType: 'text' });
  });

  it('displays linked equipment name when item.equipment is null but catalogItemEquipments has default link', () => {
    const itemWithoutEquip: CatalogItem = {
      code: 'TRI',
      name: 'Triglyceride (Mỡ máu)',
      category: 'Sinh Hóa',
      price: 40000,
      equipment: undefined,
      evaluationType: 'range',
      refMin: 0.4,
      refMax: 1.7,
      unit: 'mmol/L',
      refText: '0.4 - 1.7'
    };

    const link: CatalogItemEquipmentLink = {
      id: 'cie_tri_eq_ms360',
      catalogCode: 'TRI',
      equipmentId: 'eq_ms360',
      isDefault: true,
      evaluationType: 'range',
      refMin: 0.4,
      refMax: 1.7,
      unit: 'mmol/L'
    };

    render(
      <table>
        <tbody>
          <IndicatorTableRow
            index={0}
            item={itemWithoutEquip}
            linkedCount={1}
            isQuickEditMode={false}
            groups={mockGroups}
            equipments={mockEquipments}
            catalogItemEquipments={[link]}
            onEdit={vi.fn()}
            onConfigEquipment={vi.fn()}
            onDelete={vi.fn()}
          />
        </tbody>
      </table>
    );

    // Should display the equipment name 'MS-360' instead of fallback 'Gán máy đo'
    expect(screen.getByText('MS-360')).toBeTruthy();
    expect(screen.queryByText('Gán máy đo')).toBeNull();
  });
});


