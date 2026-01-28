import { create } from 'zustand';
import _ from 'lodash';
import type {
  DataKey,
  FieldEvent,
  FieldUIProps,
  FormStore,
  StoreActions,
  StoreState,
} from '../types/form';
import { fieldSchemas } from './schemas';
import { initialFormValues } from './initialValues';

/**
 * Zustand 스토어 생성
 *
 * 핵심 설계:
 * 1. 스키마는 UI + 이벤트만 담당 (value 없음)
 * 2. 데이터는 data.formData에서 관리
 * 3. 이벤트 핸들러는 (actions, get) => ... 형태
 * 4. 필드 단위 selector로 구독하여 성능 최적화
 */
export const useFormStore = create<FormStore>((set, get) => {
  const actions: StoreActions = {
    /**
     * 단일 필드 값 설정
     */
    setValue: (key, value) => {
      set((state) => {
        const next = structuredClone(state.data.formData);
        _.set(next, key, value);
        return { data: { ...state.data, formData: next } };
      });
    },

    /**
     * 여러 필드 값 한번에 설정
     */
    setValues: (values) => {
      set((state) => {
        const next = structuredClone(state.data.formData);
        values.forEach(({ key, value }) => {
          _.set(next, key, value);
        });
        return { data: { ...state.data, formData: next } };
      });
    },

    /**
     * 필드 UI 속성 동적 변경
     * 런타임에 hidden, disabled 등을 변경할 때 사용
     */
    setFieldUI: (key, patch) => {
      set((state) => ({
        ui: {
          ...state.ui,
          fieldUI: {
            ...state.ui.fieldUI,
            [key]: { ...(state.ui.fieldUI[key] ?? {}), ...patch },
          },
        },
      }));
    },

    /**
     * 폼 초기화
     */
    resetForm: () => {
      set((state) => ({
        data: {
          formData: structuredClone(initialFormValues),
          original: state.data.original,
        },
        ui: {
          ...state.ui,
          fieldUI: {},
        },
      }));
    },

    /**
     * 변경 여부 확인
     */
    hasChanges: () => {
      const { formData, original } = get().data;
      return !_.isEqual(formData, original);
    },

    /**
     * 필드 이벤트 처리
     * change 이벤트: 값 반영 후 핸들러 실행
     * blur/focus 이벤트: 핸들러만 실행
     */
    onFieldEvent: (event, key, value) => {
      // change 이벤트일 때만 값 반영
      if (event === 'change' && value !== undefined) {
        actions.setValue(key, value);
      }

      // 스키마에서 이벤트 핸들러 가져와 실행
      const handler = fieldSchemas[key]?.events?.[event];
      if (handler) {
        handler(actions, get as () => StoreState & { actions: StoreActions });
      }
    },

    // ===== 비즈니스 로직 액션들 =====

    /**
     * 상품명 → 표시명 동기화
     */
    syncDisplayName: () => {
      const name = get().data.formData.base.name ?? '';
      actions.setValue('base.displayName', name);
    },

    /**
     * 마진율 계산
     * 마진율 = (판매가 - 공급가) / 판매가 * 100
     */
    calculateMargin: () => {
      const { salePrice = 0, fee = 0 } = get().data.formData.price;
      if (salePrice > 0) {
        const marginRate = Math.round(((salePrice - fee) / salePrice) * 100);
        actions.setValue('price.marginRate', marginRate);
      } else {
        actions.setValue('price.marginRate', 0);
      }
    },

    /**
     * 상품코드 유효성 검사 (예시)
     */
    validateCode: async () => {
      const code = get().data.formData.base.code ?? '';

      // 영문/숫자만 허용
      const isValid = /^[A-Za-z0-9]+$/.test(code);

      if (!isValid && code.length > 0) {
        // 유효하지 않으면 에러 표시 (helpText 활용)
        actions.setFieldUI('base.code', {
          helpText: '영문과 숫자만 입력 가능합니다',
        });
        return false;
      }

      // 유효하면 원래 helpText로 복원
      actions.setFieldUI('base.code', {
        helpText: undefined,
      });
      return true;
    },
  };

  return {
    data: {
      formData: structuredClone(initialFormValues),
      original: structuredClone(initialFormValues),
    },
    ui: {
      schemas: fieldSchemas,
      fieldUI: {},
    },
    actions,
  };
});

// ===== Selector Hooks =====
// 필드 단위 구독으로 성능 최적화

/**
 * 특정 필드 값만 구독
 */
export function useFieldValue<T = unknown>(key: DataKey): T {
  return useFormStore((state) => _.get(state.data.formData, key) as T);
}

/**
 * 특정 필드 스키마만 구독
 */
export function useFieldSchema(key: DataKey) {
  return useFormStore((state) => state.ui.schemas[key]);
}

/**
 * 특정 필드의 런타임 UI 속성만 구독
 */
export function useFieldUI(key: DataKey): Partial<FieldUIProps> | undefined {
  return useFormStore((state) => state.ui.fieldUI[key]);
}

/**
 * 액션만 구독 (리렌더 방지)
 */
export function useFormActions() {
  return useFormStore((state) => state.actions);
}

/**
 * 필드 이벤트 핸들러 훅
 */
export function useFieldEventHandler(key: DataKey) {
  const actions = useFormActions();

  return {
    onChange: (value: unknown) => actions.onFieldEvent('change', key, value),
    onBlur: () => actions.onFieldEvent('blur', key),
    onFocus: () => actions.onFieldEvent('focus', key),
  };
}
