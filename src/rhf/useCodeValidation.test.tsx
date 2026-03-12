import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockValidateCode } from '@/api/mock';
import { productDefaultValues } from './schemas';
import { useCodeValidation } from './useCodeValidation';
import { useProductForm } from './useProductForm';

vi.mock('@/api/mock', () => ({
  mockValidateCode: vi.fn(),
}));

const mockedValidateCode = vi.mocked(mockValidateCode);

describe('useCodeValidation', () => {
  afterEach(() => {
    mockedValidateCode.mockReset();
  });

  function setup() {
    return renderHook(() => {
      const form = useProductForm(productDefaultValues);
      const validation = useCodeValidation({
        getValues: form.getValues,
        setError: form.setError,
        clearErrors: form.clearErrors,
        setFocus: form.setFocus,
      });

      return { form, validation };
    });
  }

  it('유효하지 않은 코드면 에러를 설정한다', async () => {
    mockedValidateCode.mockResolvedValue({
      code: 'ABC#',
      isValid: false,
      errorMessage: '영문과 숫자만 입력 가능합니다.',
    });

    const { result } = setup();

    act(() => {
      result.current.form.setValue('base.code', 'ABC#', { shouldDirty: true });
      void result.current.validation.validateCodeOnBlur();
    });

    await waitFor(() => {
      expect(result.current.form.getFieldState('base.code').error?.message).toBe(
        '영문과 숫자만 입력 가능합니다.',
      );
    });
  });

  it('비동기 검증은 최신 요청만 반영한다', async () => {
    const { result } = setup();

    let resolveFirst: ((value: Awaited<ReturnType<typeof mockValidateCode>>) => void) | null = null;
    let resolveSecond: ((value: Awaited<ReturnType<typeof mockValidateCode>>) => void) | null = null;

    mockedValidateCode
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    act(() => {
      result.current.form.setValue('base.code', 'BAD#', { shouldDirty: true });
      void result.current.validation.validateCodeOnBlur();
    });

    act(() => {
      result.current.form.setValue('base.code', 'GOOD01', { shouldDirty: true });
      void result.current.validation.validateCodeOnBlur();
    });

    await act(async () => {
      resolveSecond?.({ code: 'GOOD01', isValid: true, errorMessage: undefined });
      await Promise.resolve();
    });

    await act(async () => {
      resolveFirst?.({
        code: 'BAD#',
        isValid: false,
        errorMessage: '영문과 숫자만 입력 가능합니다.',
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.form.getFieldState('base.code').error).toBeUndefined();
    });
  });
});
