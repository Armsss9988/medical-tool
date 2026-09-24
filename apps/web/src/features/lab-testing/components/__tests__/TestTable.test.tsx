// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TestTable } from '../TestTable';
import { CatalogItem, SelectedTest, TestPackage } from '@domain/types';

describe('TestTable - Package Selection with Default Values', () => {
  afterEach(() => {
    cleanup();
  });

  const mockCatalog: CatalogItem[] = [
    {
      code: 'GLU',
      name: 'Glucose Máu',
      category: 'Sinh Hóa',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      price: 35000,
      evaluationType: 'range'
    },
    {
      code: 'HBSAG',
      name: 'HBsAg Test Nhanh',
      category: 'Miễn Dịch',
      unit: '',
      refMin: null,
      refMax: null,
      refText: 'Âm tính',
      price: 60000,
      evaluationType: 'text'
    }
  ];

  const mockPackages: TestPackage[] = [
    {
      id: 'pkg_general',
      name: 'Gói Tổng Quát',
      price: 90000,
      items: [
        { code: 'GLU', orderIndex: 1, defaultValue: '5.2', hasDefaultValue: true },
        { code: 'HBSAG', orderIndex: 2, defaultValue: 'Âm tính', hasDefaultValue: true }
      ]
    }
  ];

  it('populates default results into selectedTests when selecting a package with default values', () => {
    let selectedTests: SelectedTest[] = [];
    const setSelectedTests = vi.fn((action) => {
      selectedTests = typeof action === 'function' ? action(selectedTests) : action;
    });
    const showToast = vi.fn();

    render(
      <TestTable
        catalog={mockCatalog}
        testPackages={mockPackages}
        selectedTests={selectedTests}
        setSelectedTests={setSelectedTests}
        showToast={showToast}
      />
    );

    // Click package chip button "+ Gói Tổng Quát"
    const pkgBtn = screen.getByText(/\+ Gói Tổng Quát/i);
    fireEvent.click(pkgBtn);

    expect(setSelectedTests).toHaveBeenCalled();
    expect(selectedTests.length).toBe(2);
    expect(selectedTests[0].code).toBe('GLU');
    expect(selectedTests[0].result).toBe('5.2');
    expect(selectedTests[1].code).toBe('HBSAG');
    expect(selectedTests[1].result).toBe('Âm tính');
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('kèm 2 kết quả mặc định'), 'success');
  });

  it('does not populate default values when autoFillPackageDefaults toggle is unchecked', () => {
    let selectedTests: SelectedTest[] = [];
    const setSelectedTests = vi.fn((action) => {
      selectedTests = typeof action === 'function' ? action(selectedTests) : action;
    });

    render(
      <TestTable
        catalog={mockCatalog}
        testPackages={mockPackages}
        selectedTests={selectedTests}
        setSelectedTests={setSelectedTests}
      />
    );

    // Uncheck "Điền sẵn KQ mặc định" toggle
    const toggle = screen.getByRole('checkbox', { name: /Điền sẵn KQ mặc định/i });
    expect((toggle as HTMLInputElement).checked).toBe(true);
    fireEvent.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(false);

    // Select package
    const pkgBtn = screen.getByText(/\+ Gói Tổng Quát/i);
    fireEvent.click(pkgBtn);

    expect(selectedTests.length).toBe(2);
    expect(selectedTests[0].result).toBe('');
    expect(selectedTests[1].result).toBe('');
  });

  it('populates default value for existing test in table if its result is empty, but preserves existing result if not empty', () => {
    let selectedTests: SelectedTest[] = [
      {
        ...mockCatalog[0],
        result: '7.8', // User already typed a non-empty result
        note: 'CAO'
      },
      {
        ...mockCatalog[1],
        result: '', // Empty result
        note: 'Bình thường'
      }
    ];

    const setSelectedTests = vi.fn((action) => {
      selectedTests = typeof action === 'function' ? action(selectedTests) : action;
    });
    const showToast = vi.fn();

    render(
      <TestTable
        catalog={mockCatalog}
        testPackages={mockPackages}
        selectedTests={selectedTests}
        setSelectedTests={setSelectedTests}
        showToast={showToast}
      />
    );

    const pkgBtn = screen.getByText(/\+ Gói Tổng Quát/i);
    fireEvent.click(pkgBtn);

    expect(selectedTests.length).toBe(2);
    // GLU result is preserved as 7.8
    expect(selectedTests[0].result).toBe('7.8');
    // HBSAG empty result is filled with defaultValue 'Âm tính'
    expect(selectedTests[1].result).toBe('Âm tính');
  });

  describe('TestTable - Detection Indicator Result Entry', () => {
    const detectionCatalog: CatalogItem[] = [
      {
        code: 'HPV',
        name: 'HPV DNA Realtime PCR',
        category: 'Sinh Học Phân Tử',
        unit: 'Copies/mL',
        refText: '',
        evaluationType: 'detection'
      }
    ];

    it('automatically evaluates 0 to "Không Phát Hiện" and >0 to "Phát Hiện"', () => {
      let selectedTests: SelectedTest[] = [
        {
          ...detectionCatalog[0],
          result: '',
          note: ''
        }
      ];

      const setSelectedTests = vi.fn((action) => {
        selectedTests = typeof action === 'function' ? action(selectedTests) : action;
      });

      const { rerender } = render(
        <TestTable
          catalog={detectionCatalog}
          selectedTests={selectedTests}
          setSelectedTests={setSelectedTests}
        />
      );

      const input = screen.getByPlaceholderText('Nhập KQ...');

      // 1. Enter '0' -> auto sets note to 'Không Phát Hiện'
      fireEvent.change(input, { target: { value: '0' } });
      expect(setSelectedTests).toHaveBeenCalled();
      expect(selectedTests[0].result).toBe('0');
      expect(selectedTests[0].note).toBe('Không Phát Hiện');

      // Rerender with updated selectedTests
      rerender(
        <TestTable
          catalog={detectionCatalog}
          selectedTests={selectedTests}
          setSelectedTests={setSelectedTests}
        />
      );

      // 2. Enter '250' -> auto sets note to 'Phát Hiện'
      fireEvent.change(input, { target: { value: '250' } });
      expect(selectedTests[0].result).toBe('250');
      expect(selectedTests[0].note).toBe('Phát Hiện');
    });

    it('supports qualitative text characters for detection indicators (e.g. "Âm tính", "Dương tính")', () => {
      let selectedTests: SelectedTest[] = [
        {
          ...detectionCatalog[0],
          result: '',
          note: ''
        }
      ];

      const setSelectedTests = vi.fn((action) => {
        selectedTests = typeof action === 'function' ? action(selectedTests) : action;
      });

      const { rerender } = render(
        <TestTable
          catalog={detectionCatalog}
          selectedTests={selectedTests}
          setSelectedTests={setSelectedTests}
        />
      );

      const input = screen.getByPlaceholderText('Nhập KQ...');

      // Attempt to enter qualitative text "Âm tính"
      fireEvent.change(input, { target: { value: 'Âm tính' } });
      expect(selectedTests[0].result).toBe('Âm tính');
      expect(selectedTests[0].note).toBe('Không Phát Hiện');

      rerender(
        <TestTable
          catalog={detectionCatalog}
          selectedTests={selectedTests}
          setSelectedTests={setSelectedTests}
        />
      );

      // Attempt to enter qualitative text "Dương tính"
      fireEvent.change(input, { target: { value: 'Dương tính' } });
      expect(selectedTests[0].result).toBe('Dương tính');
      expect(selectedTests[0].note).toBe('Phát Hiện');
    });

    it('triggers evaluation correctly when populating default package results for detection indicators', () => {
      const pkgWithDetection: TestPackage = {
        id: 'pkg_pcr',
        name: 'Gói PCR Sàng Lọc',
        price: 500000,
        items: [
          { code: 'HPV', orderIndex: 1, defaultValue: '0', hasDefaultValue: true }
        ]
      };

      let selectedTests: SelectedTest[] = [];
      const setSelectedTests = vi.fn((action) => {
        selectedTests = typeof action === 'function' ? action(selectedTests) : action;
      });

      render(
        <TestTable
          catalog={detectionCatalog}
          testPackages={[pkgWithDetection]}
          selectedTests={selectedTests}
          setSelectedTests={setSelectedTests}
        />
      );

      const pkgBtn = screen.getByText(/\+ Gói PCR Sàng Lọc/i);
      fireEvent.click(pkgBtn);

      expect(selectedTests.length).toBe(1);
      expect(selectedTests[0].code).toBe('HPV');
      expect(selectedTests[0].result).toBe('0');
      expect(selectedTests[0].note).toBe('Không Phát Hiện');
    });

    it('triggers evaluation correctly for existing empty detection test when package is applied', () => {
      const pkgWithDetection: TestPackage = {
        id: 'pkg_pcr',
        name: 'Gói PCR Sàng Lọc',
        price: 500000,
        items: [
          { code: 'HPV', orderIndex: 1, defaultValue: '0', hasDefaultValue: true }
        ]
      };

      let selectedTests: SelectedTest[] = [
        {
          ...detectionCatalog[0],
          result: '',
          note: ''
        }
      ];
      const setSelectedTests = vi.fn((action) => {
        selectedTests = typeof action === 'function' ? action(selectedTests) : action;
      });

      render(
        <TestTable
          catalog={detectionCatalog}
          testPackages={[pkgWithDetection]}
          selectedTests={selectedTests}
          setSelectedTests={setSelectedTests}
        />
      );

      const pkgBtn = screen.getByText(/\+ Gói PCR Sàng Lọc/i);
      fireEvent.click(pkgBtn);

      expect(selectedTests.length).toBe(1);
      expect(selectedTests[0].result).toBe('0');
      expect(selectedTests[0].note).toBe('Không Phát Hiện');
    });

    it('tự động điền giá trị âm tính (<0.34 theo thang đo) cho gói dị nguyên khi bật autoFillPackageDefaults', () => {
      const allergenCatalog: CatalogItem[] = [
        {
          code: 'd1',
          name: 'Mạt bụi d1',
          category: 'Dị Nguyên Hô Hấp',
          unit: 'IU/ml',
          refText: '',
          scaleId: 'scale_protia_91',
          evaluationType: 'scale',
          price: 150000
        },
        {
          code: 'f1',
          name: 'Lòng trắng trứng f1',
          category: 'Dị Nguyên Thực Phẩm',
          unit: 'IU/ml',
          refText: '',
          scaleId: 'scale_allergen_44',
          evaluationType: 'scale',
          price: 150000
        }
      ];

      const allergenPackage: TestPackage = {
        id: 'pkg_dn_combo',
        name: 'Gói Dị Nguyên Test',
        price: 300000,
        items: [
          { code: 'd1', orderIndex: 1 },
          { code: 'f1', orderIndex: 2 }
        ]
      };

      let selectedTests: SelectedTest[] = [];
      const setSelectedTests = vi.fn((action) => {
        selectedTests = typeof action === 'function' ? action(selectedTests) : action;
      });

      render(
        <TestTable
          catalog={allergenCatalog}
          testPackages={[allergenPackage]}
          selectedTests={selectedTests}
          setSelectedTests={setSelectedTests}
        />
      );

      const pkgBtn = screen.getByText(/\+ Gói Dị Nguyên Test/i);
      fireEvent.click(pkgBtn);

      expect(selectedTests.length).toBe(2);
      // d1 thuộc Protia 91 -> tự động điền <0.34
      expect(selectedTests[0].code).toBe('d1');
      expect(selectedTests[0].result).toBe('<0.34');
      expect(selectedTests[0].note).toBe('Âm tính (Độ 0)');

      // f1 thuộc Mediwiss 44 -> tự động điền <0.34
      expect(selectedTests[1].code).toBe('f1');
      expect(selectedTests[1].result).toBe('<0.34');
      expect(selectedTests[1].note).toBe('Âm tính (Độ 0)');
    });
  });
});
