import type { FieldPath } from 'react-hook-form';
import type { FieldUIProps } from '@/types/form';

export type ProductFormValues = {
  base: {
    name: string;
    displayName: string;
    code: string;
  };
  price: {
    salePrice: number;
    fee: number;
    marginRate: number;
  };
  delivery: {
    type: 'standard' | 'express' | 'pickup';
    cost: number;
    freeThreshold: number;
  };
  options: {
    isActive: boolean;
    memo: string;
  };
};

export type ProductFieldName = Exclude<
  FieldPath<ProductFormValues>,
  'base' | 'price' | 'delivery' | 'options'
>;

export type ProductFieldMeta = {
  name: ProductFieldName;
  ui: FieldUIProps;
};

export type ProductSectionConfig = {
  id: string;
  title: string;
  fields: ProductFieldName[];
};

export type FieldRuleHandlers = {
  onChange?: (value: unknown) => void;
  onBlur?: () => void | Promise<void>;
};

export type FieldOverrides = Partial<
  Record<ProductFieldName, Partial<Pick<FieldUIProps, 'hidden' | 'disabled' | 'helpText' | 'errorMessage'>>>
>;
