const TEST_DELAY_MS = 300;

export const mockValidateCode = async (code: string) => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, TEST_DELAY_MS);
  });

  const normalizedCode = code.trim().toUpperCase();
  const isValid = /^[A-Z0-9]+$/.test(normalizedCode);
  const errorMessage = isValid ? undefined : "영문과 숫자만 입력 가능합니다.";

  return {
    code: normalizedCode,
    isValid,
    errorMessage,
  };
};
