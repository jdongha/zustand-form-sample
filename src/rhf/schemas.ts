import type { ProductFormValues } from './types';

export const productDefaultValues: ProductFormValues = {
  base: {
    name: '',
    displayName: '',
    code: '',
  },
  price: {
    salePrice: 0,
    fee: 0,
    marginRate: 0,
  },
  delivery: {
    type: 'standard',
    cost: 0,
    freeThreshold: 0,
  },
  options: {
    isActive: true,
    memo: '',
  },
};
