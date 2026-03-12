import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormPageRHF } from './FormPageRHF';

function getControlByLabel(label: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  const labelEl = screen.getByText(new RegExp(`^${label}`));
  const container = labelEl.closest('div.space-y-1');
  if (!container) {
    throw new Error(`필드 컨테이너를 찾을 수 없습니다: ${label}`);
  }

  const control = container.querySelector('input, select, textarea');
  if (!control) {
    throw new Error(`필드 컨트롤을 찾을 수 없습니다: ${label}`);
  }

  return control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
}

describe('FormPageRHF', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('입력 규칙(change/derived)을 UI에서 반영한다', async () => {
    const user = userEvent.setup();
    render(<FormPageRHF />);

    const nameInput = screen.getByPlaceholderText('상품명을 입력하세요');
    const displayNameInput = screen.getByPlaceholderText('화면에 표시될 상품명');

    await user.clear(nameInput);
    await user.type(nameInput, '테스트 상품');

    await waitFor(() => {
      expect(displayNameInput).toHaveValue('테스트 상품');
    });

    const salePriceInput = getControlByLabel('판매가');
    const feeInput = getControlByLabel('공급가');
    const marginRateInput = getControlByLabel('마진율');

    await user.clear(salePriceInput);
    await user.type(salePriceInput, '10000');
    await user.clear(feeInput);
    await user.type(feeInput, '7000');

    await waitFor(() => {
      expect(marginRateInput).toHaveValue(30);
    });
  });

  it('배송 규칙에 따라 숨김/표시를 제어한다', async () => {
    const user = userEvent.setup();
    render(<FormPageRHF />);

    const deliveryTypeSelect = getControlByLabel('배송유형');
    await user.selectOptions(deliveryTypeSelect, 'pickup');

    expect(screen.queryByText(/^배송비/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^무료배송 기준금액/)).not.toBeInTheDocument();

    await user.selectOptions(deliveryTypeSelect, 'standard');

    const deliveryCostInput = getControlByLabel('배송비');
    await user.clear(deliveryCostInput);
    await user.type(deliveryCostInput, '3000');

    await waitFor(() => {
      expect(screen.getByText(/^무료배송 기준금액/)).toBeInTheDocument();
    });

    await user.clear(deliveryCostInput);
    await user.type(deliveryCostInput, '0');

    await waitFor(() => {
      expect(screen.queryByText(/^무료배송 기준금액/)).not.toBeInTheDocument();
    });
  });

  it('submit 시 RHF 데이터 shape를 전달한다', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    render(<FormPageRHF />);

    await user.clear(screen.getByPlaceholderText('상품명을 입력하세요'));
    await user.type(screen.getByPlaceholderText('상품명을 입력하세요'), '제출용 상품');

    await user.click(screen.getByRole('button', { name: '저장하기' }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    const submitCall = consoleSpy.mock.calls.find(
      (call) => call[0] === 'Submit form data (RHF):',
    );

    expect(submitCall).toBeDefined();
    expect(submitCall?.[1]).toMatchObject({
      base: {
        name: '제출용 상품',
        displayName: '제출용 상품',
      },
      price: {
        salePrice: expect.any(Number),
        fee: expect.any(Number),
        marginRate: expect.any(Number),
      },
      delivery: {
        type: expect.any(String),
      },
      options: {
        isActive: expect.any(Boolean),
      },
    });

    expect(alertSpy).toHaveBeenCalledWith('RHF 폼 데이터가 콘솔에 출력되었습니다.');
  });

  it('상품코드 blur 시 검증 에러를 표시한다', async () => {
    const user = userEvent.setup();
    render(<FormPageRHF />);

    const codeInput = screen.getByPlaceholderText('영문/숫자만 입력');
    await user.clear(codeInput);
    await user.type(codeInput, 'ABC#');
    await user.tab();

    await waitFor(() => {
      const baseSection = screen.getByText('📦 기본정보').closest('section');
      expect(baseSection).not.toBeNull();
      expect(within(baseSection as HTMLElement).getByText('영문과 숫자만 입력 가능합니다.')).toBeInTheDocument();
    });
  });
});
