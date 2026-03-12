import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { productDefaultValues } from './schemas';
import { useProductFormBehaviors } from './useProductFormBehaviors';
import { useProductForm } from './useProductForm';

vi.mock('./useCodeValidation', async () => {
  const original = await vi.importActual<typeof import('./useCodeValidation')>('./useCodeValidation');
  return {
    ...original,
    useCodeValidation: () => ({
      validateCodeOnBlur: vi.fn(),
    }),
  };
});

describe('useProductFormBehaviors', () => {
  function setup() {
    return renderHook(() => {
      const form = useProductForm(productDefaultValues);
      const behaviors = useProductFormBehaviors(form);
      return { form, behaviors };
    });
  }

  it('필드 규칙 핸들러를 필드 키 기준으로 제공한다', () => {
    const { result } = setup();

    expect(result.current.behaviors.fieldRules['base.name']?.onChange).toBeTypeOf('function');
    expect(result.current.behaviors.fieldRules['base.code']?.onBlur).toBeTypeOf('function');
    expect(result.current.behaviors.fieldRules['price.salePrice']?.onChange).toBeTypeOf('function');
  });

  it('배송 관련 override와 리셋 규칙을 반영한다', async () => {
    const { result } = setup();

    expect(result.current.behaviors.fieldOverrides['delivery.cost']?.hidden).toBe(false);
    expect(result.current.behaviors.fieldOverrides['delivery.freeThreshold']?.hidden).toBe(true);

    act(() => {
      result.current.form.setValue('delivery.cost', 3000, { shouldDirty: true });
      result.current.form.setValue('delivery.freeThreshold', 40000, { shouldDirty: true });
      result.current.form.setValue('delivery.type', 'pickup', { shouldDirty: true });
      result.current.behaviors.fieldRules['delivery.type']?.onChange?.('pickup');
    });

    await waitFor(() => {
      expect(result.current.behaviors.fieldOverrides['delivery.cost']?.hidden).toBe(true);
      expect(result.current.behaviors.fieldOverrides['delivery.freeThreshold']?.hidden).toBe(true);
      expect(result.current.form.getValues('delivery.cost')).toBe(0);
      expect(result.current.form.getValues('delivery.freeThreshold')).toBe(0);
    });
  });
});
