# RHF 리팩토링 계획 (branch: `codex/rhf-refactor-plan`)

## 1) 현재 코드 평가

결론부터 말하면, **현재 구조는 비즈니스 요구 달성력은 높지만, 대중성과 학습/채용 시장 관점의 표준성은 다소 낮습니다.**

- 강점
  - `schema + events`로 도메인 규칙이 한곳에 모여 있어 요구사항 추적이 쉽다.
  - 필드 단위 selector 구독으로 대규모 폼에서 리렌더를 억제한다.
  - `dirty` 증분 계산으로 변경 여부 판단이 효율적이다.
- 한계
  - 폼 엔진(값/검증/dirty/focus)을 직접 구현해 유지보수 비용이 커진다.
  - `_.get/_.set + 문자열 경로` 기반은 런타임 안정성 보강(검증/테스트)이 필수다.
  - 비동기 검증(`validatePrdCd`)은 최신 요청 보장(경합 방지) 장치가 없다.

즉, “최선”이라고 단정하기는 어렵고, **요구사항 중심으로는 합리적**, **일반적인 팀/생태계 기준으로는 RHF + 스키마 검증 쪽이 더 표준적**입니다.

## 2) 대안 제안

### 권장 대안: `react-hook-form + zod + 룰 엔진(커스텀)`

- RHF가 담당
  - 입력 등록, 필드 상태, dirty/touched, submit lifecycle
- Zod가 담당
  - 타입 안전한 런타임 검증
- 기존 schema/events에서 유지할 것
  - 도메인 규칙(연쇄 계산, 숨김/비활성화, 포커스 이동)

핵심은 "기존 도메인 규칙은 유지"하고, "폼 엔진만 표준 라이브러리로 교체"하는 것입니다.

## 3) 마이그레이션 범위

- 유지
  - `fieldSchemas`의 UI 메타와 이벤트 의도
  - 화면 섹션 구조 (`FormPage`, `AutoForm`)
- 교체
  - 값 저장/dirty 추적/검증/submit/reset의 중심을 Zustand -> RHF로 이동
- 분리
  - UI 오버라이드(`hidden/disabled/error`)는 별도 `rule state`로 유지 가능

## 4) 단계별 실행 계획

1. 기준선 확보
- 현행 브랜치에서 핵심 시나리오(이름 동기화, 마진 계산, 배송 타입 전환, 코드 blur 검증) 체크리스트 작성

2. 라이브러리 도입
- `react-hook-form`, `zod`, `@hookform/resolvers` 추가
- `ProductFormValues`, `productFormSchema` 생성

3. RHF 어댑터 컴포넌트 도입
- `SchemaFieldRHF` 추가 (`useController` 기반)
- 기존 `FormField` 재사용

4. 룰 엔진 훅 분리
- `useFormRules`에서 `watch`, `setValue`, `setError`, `clearErrors`, `setFocus` 사용
- 기존 `syncDisplayName`, `calculateMargin`, `delivery` 제어 규칙 이관

5. 점진 전환
- 섹션별로 기존 Zustand `SchemaField` -> RHF `SchemaFieldRHF` 교체
- 디버그 패널은 RHF `watch()`로 전환

6. 안정화
- 비동기 코드 검증에 요청 토큰(마지막 요청만 반영) 적용
- blur/change 트리거 정책 정리

7. 최종 정리
- 폼 엔진 관련 Zustand 코드 제거
- Zustand는 폼 외 전역 상태가 필요할 때만 유지

## 5) 샘플 코드 (핵심 패턴)

```tsx
// src/features/product-form/useProductForm.ts
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const productFormSchema = z.object({
  base: z.object({
    name: z.string().min(1, '상품명은 필수입니다').max(80),
    displayName: z.string().min(1, '표시명은 필수입니다').max(80),
    code: z.string().max(20),
  }),
  price: z.object({
    salePrice: z.number().min(0),
    fee: z.number().min(0),
    marginRate: z.number().min(0).max(100),
  }),
  delivery: z.object({
    type: z.enum(['standard', 'express', 'pickup']),
    cost: z.number().min(0),
    freeThreshold: z.number().min(0),
  }),
  options: z.object({
    isActive: z.boolean(),
    memo: z.string().max(500),
  }),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function useProductForm(defaultValues: ProductFormValues) {
  return useForm<ProductFormValues>({
    defaultValues,
    resolver: zodResolver(productFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
}
```

```tsx
// src/features/product-form/useFormRules.ts
import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { mockValidateCode } from '@/api/mock';
import type { ProductFormValues } from './useProductForm';

export function useFormRules(form: UseFormReturn<ProductFormValues>) {
  const { watch, setValue, setError, clearErrors, setFocus, getValues } = form;
  const requestIdRef = useRef(0);

  const name = watch('base.name');
  const salePrice = watch('price.salePrice');
  const fee = watch('price.fee');
  const deliveryType = watch('delivery.type');
  const deliveryCost = watch('delivery.cost');

  useEffect(() => {
    setValue('base.displayName', name ?? '', { shouldDirty: true });
  }, [name, setValue]);

  useEffect(() => {
    const marginRate = salePrice > 0 ? Math.round(((salePrice - fee) / salePrice) * 100) : 0;
    setValue('price.marginRate', marginRate, { shouldDirty: true });
  }, [salePrice, fee, setValue]);

  useEffect(() => {
    if (deliveryType !== 'pickup') return;
    setValue('delivery.cost', 0, { shouldDirty: true });
    setValue('delivery.freeThreshold', 0, { shouldDirty: true });
  }, [deliveryType, setValue]);

  useEffect(() => {
    if (deliveryCost !== 0) return;
    setValue('delivery.freeThreshold', 0, { shouldDirty: true });
  }, [deliveryCost, setValue]);

  const validateCodeOnBlur = async () => {
    const currentId = ++requestIdRef.current;
    const code = getValues('base.code') ?? '';
    const result = await mockValidateCode(code);
    if (currentId !== requestIdRef.current) return; // 최신 요청만 반영

    if (!result.isValid && code.length > 0) {
      setError('base.code', { type: 'validate', message: result.errorMessage });
      setFocus('base.code');
      return;
    }

    clearErrors('base.code');
  };

  return {
    uiState: {
      hideDeliveryCost: deliveryType === 'pickup',
      hideFreeThreshold: deliveryType === 'pickup' || deliveryCost === 0,
    },
    handlers: { validateCodeOnBlur },
  };
}
```

```tsx
// src/features/product-form/SchemaFieldRHF.tsx
import { useController, useFormContext } from 'react-hook-form';
import { FormField } from '@/components/FormField';
import type { ProductFormValues } from './useProductForm';

type Props = {
  name: keyof any; // 실제 구현에서는 FieldPath<ProductFormValues>
  ui: {
    label?: string;
    required?: boolean;
    hidden?: boolean;
    disabled?: boolean;
    maxLength?: number;
    placeholder?: string;
    helpText?: string;
    fieldType?: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
    options?: { label: string; value: string | number }[];
  };
  onBlurRule?: () => void;
};

export function SchemaFieldRHF({ name, ui, onBlurRule }: Props) {
  const { control } = useFormContext<ProductFormValues>();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  if (ui.hidden) return null;

  return (
    <FormField
      label={ui.label}
      required={ui.required}
      disabled={ui.disabled}
      maxLength={ui.maxLength}
      placeholder={ui.placeholder}
      helpText={ui.helpText}
      errorMessage={error?.message}
      fieldType={ui.fieldType}
      options={ui.options}
      value={field.value}
      onChange={field.onChange}
      onBlur={() => {
        field.onBlur();
        onBlurRule?.();
      }}
    />
  );
}
```

## 6) 판단 기준 (완료 정의)

- 필드 변경 시 타 섹션 불필요 리렌더가 유의미하게 증가하지 않을 것
- 기존 비즈니스 규칙 4종(동기화/계산/숨김/검증) 동작 동일성 확보
- 제출 데이터 shape가 기존과 동일할 것
- 코드량 감소 또는 복잡도(엔진 코드) 감소가 확인될 것

## 7) 권장 브랜치 전략

- 계획 브랜치: `codex/rhf-refactor-plan` (현재)
- 구현 브랜치: `codex/rhf-refactor-impl` (실제 코드 이관)
- 방식: 섹션 단위 PR(기본정보 -> 가격 -> 배송 -> 옵션)
