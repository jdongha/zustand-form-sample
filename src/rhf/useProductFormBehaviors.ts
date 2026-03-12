import { useCallback, useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import {
  calculateMargin,
  shouldResetDeliveryByType,
  shouldResetFreeThresholdByCost,
} from './rules';
import type {
  FieldOverrides,
  FieldRuleHandlers,
  ProductFieldName,
  ProductFormValues,
} from './types';
import { useCodeValidation } from './useCodeValidation';

function toSafeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useProductFormBehaviors(form: UseFormReturn<ProductFormValues>) {
  const { getValues, setValue, control } = form;

  const deliveryType = useWatch({ control, name: 'delivery.type' });
  const deliveryCost = useWatch({ control, name: 'delivery.cost' });

  const hideDeliveryCost = deliveryType === 'pickup';
  const hideFreeThreshold = hideDeliveryCost || deliveryCost === 0;

  const { validateCodeOnBlur } = useCodeValidation({
    getValues: form.getValues,
    setError: form.setError,
    clearErrors: form.clearErrors,
    setFocus: form.setFocus,
  });

  const syncDisplayName = useCallback(
    (value: unknown) => {
      const nextName = String(value ?? '');
      if (getValues('base.displayName') === nextName) return;
      setValue('base.displayName', nextName, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  const syncMargin = useCallback(
    (next: Partial<Pick<ProductFormValues['price'], 'salePrice' | 'fee'>>) => {
      const salePrice = next.salePrice ?? getValues('price.salePrice') ?? 0;
      const fee = next.fee ?? getValues('price.fee') ?? 0;
      const nextMarginRate = calculateMargin(salePrice, fee);

      if (getValues('price.marginRate') === nextMarginRate) return;
      setValue('price.marginRate', nextMarginRate, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  const handleDeliveryTypeChange = useCallback(
    (value: unknown) => {
      const type = value as ProductFormValues['delivery']['type'];
      if (!shouldResetDeliveryByType(type)) return;

      if (getValues('delivery.cost') !== 0) {
        setValue('delivery.cost', 0, { shouldDirty: true });
      }

      if (getValues('delivery.freeThreshold') !== 0) {
        setValue('delivery.freeThreshold', 0, { shouldDirty: true });
      }
    },
    [getValues, setValue],
  );

  const handleDeliveryCostChange = useCallback(
    (value: unknown) => {
      const cost = toSafeNumber(value);
      if (!shouldResetFreeThresholdByCost(cost)) return;
      if (getValues('delivery.freeThreshold') === 0) return;

      setValue('delivery.freeThreshold', 0, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  const fieldRules = useMemo<Partial<Record<ProductFieldName, FieldRuleHandlers>>>(
    () => ({
      'base.name': {
        onChange: syncDisplayName,
      },
      'base.code': {
        onBlur: validateCodeOnBlur,
      },
      'price.salePrice': {
        onChange: (value) => syncMargin({ salePrice: toSafeNumber(value) }),
      },
      'price.fee': {
        onChange: (value) => syncMargin({ fee: toSafeNumber(value) }),
      },
      'delivery.type': {
        onChange: handleDeliveryTypeChange,
      },
      'delivery.cost': {
        onChange: handleDeliveryCostChange,
      },
    }),
    [
      handleDeliveryCostChange,
      handleDeliveryTypeChange,
      syncDisplayName,
      syncMargin,
      validateCodeOnBlur,
    ],
  );

  const fieldOverrides = useMemo<FieldOverrides>(
    () => ({
      'delivery.cost': { hidden: hideDeliveryCost },
      'delivery.freeThreshold': { hidden: hideFreeThreshold },
    }),
    [hideDeliveryCost, hideFreeThreshold],
  );

  return {
    fieldRules,
    fieldOverrides,
    uiState: {
      hideDeliveryCost,
      hideFreeThreshold,
    },
  };
}
