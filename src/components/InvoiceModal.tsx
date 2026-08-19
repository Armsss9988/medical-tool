import { useState } from 'react';
import { X, CreditCard, CheckCircle } from 'lucide-react';
import { Patient, SelectedTest, TestPackage, Doctor, Invoice } from '@domain/types';
import { CreateInvoiceUseCase } from '../usecases/CreateInvoiceUseCase';
import { Money } from '../domain/valueObjects/Money';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  selectedTests: SelectedTest[];
  currentPackageId: string;
  testPackages: TestPackage[];
  doctorsList?: Doctor[];
  doctorName?: string;
  onSaveInvoice: (newInvoice: Invoice) => void;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  patient,
  selectedTests,
  currentPackageId,
  testPackages,
  doctorsList,
  doctorName,
  onSaveInvoice
}: InvoiceModalProps) {
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Tiền mặt' | 'Chuyển khoản (VietQR)' | 'Quẹt thẻ'>('Tiền mặt');
  const selectedDoc = doctorName || patient.doctor || doctorsList?.[0]?.name || 'BS. Trần Hoài Long';

  if (!isOpen) return null;

  const rawTotal = selectedTests.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalMoney = new Money(rawTotal);
  const finalMoney = totalMoney.applyDiscount(discountVal);

  const handleCreate = () => {
    const usecase = new CreateInvoiceUseCase();
    const pkg = testPackages.find((p) => p.id === currentPackageId);

    const invoice = usecase.execute({
      patient,
      selectedTests,
      doctorName: selectedDoc,
      packageName: pkg ? pkg.name : 'Tùy chọn',
      discountAmount: discountVal,
      paymentMethod
    });

    onSaveInvoice(invoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-indigo-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Tạo Hóa Đơn & Thanh Toán</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-xs space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <p><strong className="text-slate-700">Bệnh nhân:</strong> {patient.name || '---'} ({patient.code})</p>
            <p><strong className="text-slate-700">Số lượng dịch vụ:</strong> {selectedTests.length} chỉ số</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>Tổng tiền dịch vụ:</span>
              <span className="font-mono text-slate-900 font-bold">{totalMoney.formatVND()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Giảm giá / Chiết khấu (VNĐ):</span>
              <input
                type="number"
                value={discountVal}
                onChange={(e) => setDiscountVal(Number(e.target.value))}
                className="w-32 px-2.5 py-1 border border-slate-300 rounded text-right font-mono font-bold text-slate-900"
              />
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-base font-extrabold text-indigo-900">
              <span>THỰC THU:</span>
              <span className="font-mono text-xl text-emerald-700">{finalMoney.formatVND()}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hình Thức Thanh Toán</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold"
            >
              <option value="Tiền mặt">Tiền mặt</option>
              <option value="Chuyển khoản (VietQR)">Chuyển khoản (VietQR)</option>
              <option value="Quẹt thẻ">Quẹt thẻ POS</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs">
            Hủy
          </button>
          <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>Xác Nhận Thanh Toán</span>
          </button>
        </div>
      </div>
    </div>
  );
}
