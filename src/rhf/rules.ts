import type { ProductFormValues } from './types';

export function calculateMargin(salePrice: number, fee: number): number {
  if (salePrice <= 0) return 0;
  return Math.round(((salePrice - fee) / salePrice) * 100);
}

export function shouldResetDeliveryByType(
  type: ProductFormValues['delivery']['type'],
): boolean {
  return type === 'pickup';
}

export function shouldResetFreeThresholdByCost(cost: number): boolean {
  return cost === 0;
}
