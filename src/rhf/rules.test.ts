import { describe, expect, it } from 'vitest';
import {
  calculateMargin,
  shouldResetDeliveryByType,
  shouldResetFreeThresholdByCost,
} from './rules';

describe('rules', () => {
  it('calculateMargin은 판매가/공급가를 기반으로 마진율을 계산한다', () => {
    expect(calculateMargin(10000, 7000)).toBe(30);
    expect(calculateMargin(10000, 11000)).toBe(-10);
    expect(calculateMargin(0, 0)).toBe(0);
  });

  it('배송유형이 pickup이면 배송비/무료배송 기준 리셋 대상이다', () => {
    expect(shouldResetDeliveryByType('pickup')).toBe(true);
    expect(shouldResetDeliveryByType('standard')).toBe(false);
    expect(shouldResetDeliveryByType('express')).toBe(false);
  });

  it('배송비가 0이면 무료배송 기준금액 리셋 대상이다', () => {
    expect(shouldResetFreeThresholdByCost(0)).toBe(true);
    expect(shouldResetFreeThresholdByCost(1000)).toBe(false);
  });
});
