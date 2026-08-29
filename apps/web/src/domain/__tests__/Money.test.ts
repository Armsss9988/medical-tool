import { describe, it, expect } from 'vitest';
import { Money } from '../valueObjects/Money';

describe('Money Value Object', () => {
  it('should round amounts and enforce non-negative values', () => {
    const m1 = new Money(100000.7);
    expect(m1.amount).toBe(100001);

    const m2 = new Money(-5000);
    expect(m2.amount).toBe(0);
  });

  it('should add and subtract correctly', () => {
    const m1 = new Money(100000);
    const m2 = new Money(50000);

    expect(m1.add(m2).amount).toBe(150000);
    expect(m1.subtract(m2).amount).toBe(50000);
    expect(m2.subtract(m1).amount).toBe(0); // non-negative clamp
  });

  it('should apply discount amount and discount percent correctly', () => {
    const m = new Money(200000);
    expect(m.applyDiscount(50000).amount).toBe(150000);
    expect(m.applyDiscountPercent(10).amount).toBe(180000);
    expect(m.applyDiscount(300000).amount).toBe(0);
  });

  it('should format Vietnamese currency string correctly', () => {
    const m = new Money(250000);
    expect(m.format()).toBe('250.000 ₫');
  });
});
