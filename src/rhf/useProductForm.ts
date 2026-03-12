import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';
import { productDefaultValues } from './schemas';
import type { ProductFormValues } from './types';

const trimmed = z.string().trim();

export const productFormSchema = z.object({
  base: z.object({
    name: trimmed.max(80),
    displayName: trimmed.max(80),
    code: trimmed.max(20),
  }),
  price: z.object({
    salePrice: z.coerce.number().min(0),
    fee: z.coerce.number().min(0),
    marginRate: z.coerce.number().min(0).max(100),
  }),
  delivery: z.object({
    type: z.enum(['standard', 'express', 'pickup']),
    cost: z.coerce.number().min(0),
    freeThreshold: z.coerce.number().min(0),
  }),
  options: z.object({
    isActive: z.boolean(),
    memo: trimmed.max(500),
  }),
});

export function useProductForm(
  defaultValues: ProductFormValues = productDefaultValues,
) {
  const clonedDefaults = useMemo(() => structuredClone(defaultValues), [defaultValues]);
  const resolver = zodResolver(productFormSchema) as Resolver<ProductFormValues>;

  return useForm<ProductFormValues>({
    defaultValues: clonedDefaults,
    resolver,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
}
