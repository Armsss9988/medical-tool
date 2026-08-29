import { describe, it, expect } from 'vitest';
import { BillingStatusVO } from '../valueObjects/BillingStatusVO';

describe('BillingStatusVO', () => {
  it('should initialize UNPAID by default or with unknown value', () => {
    const vo = BillingStatusVO.from();
    expect(vo.value).toBe('Chưa thu phí');
    expect(vo.isUnpaid()).toBe(true);
    expect(vo.isPaid()).toBe(false);
    expect(vo.isRefunded()).toBe(false);
  });

  it('should parse PAID status correctly', () => {
    const vo1 = BillingStatusVO.from('Đã thanh toán');
    const vo2 = BillingStatusVO.from('PAID');
    expect(vo1.value).toBe('Đã thanh toán');
    expect(vo1.isPaid()).toBe(true);
    expect(vo2.isPaid()).toBe(true);
    expect(vo1.canRefund()).toBe(true);
    expect(vo1.canCollect()).toBe(false);
  });

  it('should parse REFUNDED status correctly', () => {
    const vo1 = BillingStatusVO.from('Đã hủy / Hoàn tiền');
    const vo2 = BillingStatusVO.from('REFUNDED');
    const vo3 = BillingStatusVO.from('Đã hủy');
    expect(vo1.value).toBe('Đã hủy / Hoàn tiền');
    expect(vo1.isRefunded()).toBe(true);
    expect(vo2.isRefunded()).toBe(true);
    expect(vo3.isRefunded()).toBe(true);
    expect(vo1.canCollect()).toBe(true);
  });

  it('should verify equality correctly', () => {
    expect(BillingStatusVO.PAID.equals('Đã thanh toán')).toBe(true);
    expect(BillingStatusVO.PAID.equals(BillingStatusVO.PAID)).toBe(true);
    expect(BillingStatusVO.PAID.equals(BillingStatusVO.UNPAID)).toBe(false);
  });
});
