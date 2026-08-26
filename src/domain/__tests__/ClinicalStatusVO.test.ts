import { describe, it, expect } from 'vitest';
import { ClinicalStatusVO } from '../valueObjects/ClinicalStatusVO';

describe('ClinicalStatusVO', () => {
  it('should initialize DRAFT by default', () => {
    const vo = ClinicalStatusVO.from();
    expect(vo.value).toBe('Chờ xét nghiệm');
    expect(vo.isDraft()).toBe(true);
  });

  it('should parse RESULTED and DELIVERED correctly', () => {
    const resulted = ClinicalStatusVO.from('Đã có kết quả');
    expect(resulted.isResulted()).toBe(true);

    const delivered = ClinicalStatusVO.from('Đã trả kết quả');
    expect(delivered.isDelivered()).toBe(true);
  });

  it('should enforce state transition rules', () => {
    const draft = ClinicalStatusVO.DRAFT;
    const resulted = ClinicalStatusVO.RESULTED;
    const delivered = ClinicalStatusVO.DELIVERED;

    // DRAFT -> RESULTED is allowed
    expect(draft.canTransitionTo(resulted)).toBe(true);
    // DRAFT -> DELIVERED directly is NOT allowed
    expect(draft.canTransitionTo(delivered)).toBe(false);

    // RESULTED -> DELIVERED is allowed
    expect(resulted.canTransitionTo(delivered)).toBe(true);
  });
});
