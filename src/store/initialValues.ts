import type { FormData } from '../types/form';

/**
 * 폼 데이터 초기값
 * 스키마와 분리하여 관리
 */
export const initialFormValues: FormData = {
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
