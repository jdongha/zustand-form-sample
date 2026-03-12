import { useCallback, useRef } from 'react';
import type {
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetError,
  UseFormSetFocus,
} from 'react-hook-form';
import { mockValidateCode } from '@/api/mock';
import type { ProductFormValues } from './types';

type UseCodeValidationParams = {
  getValues: UseFormGetValues<ProductFormValues>;
  setError: UseFormSetError<ProductFormValues>;
  clearErrors: UseFormClearErrors<ProductFormValues>;
  setFocus: UseFormSetFocus<ProductFormValues>;
};

export function useCodeValidation({
  getValues,
  setError,
  clearErrors,
  setFocus,
}: UseCodeValidationParams) {
  const requestIdRef = useRef(0);

  const validateCodeOnBlur = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    const code = getValues('base.code') ?? '';

    const { isValid, errorMessage } = await mockValidateCode(code);

    if (currentRequestId !== requestIdRef.current) return;

    if (!isValid && code.length > 0) {
      setError('base.code', {
        type: 'validate',
        message: errorMessage,
      });
      setFocus('base.code');
      return;
    }

    clearErrors('base.code');
  }, [clearErrors, getValues, setError, setFocus]);

  return {
    validateCodeOnBlur,
  };
}
