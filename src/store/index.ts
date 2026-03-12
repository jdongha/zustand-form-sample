import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { produce } from "immer";
import _ from "lodash";
import type {
  DataKey,
  FieldUIProps,
  FormStore,
  PathValue,
  StoreActions,
  StoreState,
} from "@/types/form";
import { fieldSchemas } from "@/store/schemas";
import { initialFormValues } from "@/store/initialValues";
import { mockValidateCode } from "@/api/mock";

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
     *
     * - 폼 데이터는 중첩 객체이므로 key(path) 기반 업데이트가 필요하다. (ex: "base.name")
     * - 매번 전체 객체를 structuredClone 하지 않고, 변경된 경로만 불변 갱신하려고 immer를 사용한다.
     * - hasChanges 계산 비용을 줄이기 위해 deep compare 대신 dirty 상태를 증분 갱신한다.
     */
    setValue: (key, value) => {
      set((state) => {
        // 1) 현재 값과 동일하면 아무 것도 하지 않는다.
        const currentValue = _.get(state.data.formData, key);
        if (Object.is(currentValue, value)) return state;

        // 2) immer produce:
        //    draft는 "변경 가능한 것처럼" 다루지만, 결과는 불변 객체(next)로 생성된다.
        //    즉, 직접 mutate 문법을 쓰면서도 불변성은 유지된다.
        const next = produce(state.data.formData, (draft) => {
          _.set(draft, key, value);
        });

        // 3) dirty 증분 계산:
        //    "현재 입력값(value)"을 original의 같은 path 값과 비교해서 dirty 여부를 갱신한다.
        //    shouldBeDirty: 이번 업데이트 후 dirty여야 하는지
        //    wasDirty: 업데이트 전 dirty였는지
        const originalValue = _.get(state.data.original, key);
        const shouldBeDirty = !Object.is(value, originalValue);
        const wasDirty = Boolean(state.data.dirtyKeys[key]);

        // 4) dirty 상태가 실제로 바뀔 때만 map/count를 수정한다.
        let nextDirtyKeys = state.data.dirtyKeys;
        let nextDirtyCount = state.data.dirtyCount;
        if (shouldBeDirty !== wasDirty) {
          // 얕은 복사 후 필요한 key만 갱신 (불변성 유지 + 비용 최소화)
          nextDirtyKeys = { ...state.data.dirtyKeys };
          if (shouldBeDirty) {
            nextDirtyKeys[key] = true;
            nextDirtyCount += 1;
          } else {
            delete nextDirtyKeys[key];
            nextDirtyCount -= 1;
          }
        }

        return {
          data: {
            ...state.data,
            formData: next,
            dirtyKeys: nextDirtyKeys,
            dirtyCount: nextDirtyCount,
            hasChanges: nextDirtyCount > 0,
          },
        };
      });
    },

    /**
     * 여러 필드 값 한번에 설정
     */
    setValues: (values) => {
      set((state) => {
        const touchedKeys = new Set<DataKey>();
        let hasChange = false;
        const next = produce(state.data.formData, (draft) => {
          values.forEach(({ key, value }) => {
            const currentValue = _.get(draft, key);
            if (Object.is(currentValue, value)) return;
            _.set(draft, key, value);
            hasChange = true;
            touchedKeys.add(key);
          });
        });
        if (!hasChange) return state;

        let nextDirtyKeys = state.data.dirtyKeys;
        let nextDirtyCount = state.data.dirtyCount;

        for (const touchedKey of touchedKeys) {
          const nextValue = _.get(next, touchedKey);
          const originalValue = _.get(state.data.original, touchedKey);
          const shouldBeDirty = !Object.is(nextValue, originalValue);
          const wasDirty = Boolean(nextDirtyKeys[touchedKey]);

          if (shouldBeDirty === wasDirty) continue;

          if (nextDirtyKeys === state.data.dirtyKeys) {
            nextDirtyKeys = { ...state.data.dirtyKeys };
          }

          if (shouldBeDirty) {
            nextDirtyKeys[touchedKey] = true;
            nextDirtyCount += 1;
          } else {
            delete nextDirtyKeys[touchedKey];
            nextDirtyCount -= 1;
          }
        }

        return {
          data: {
            ...state.data,
            formData: next,
            dirtyKeys: nextDirtyKeys,
            dirtyCount: nextDirtyCount,
            hasChanges: nextDirtyCount > 0,
          },
        };
      });
    },

    /**
     * 필드 UI 속성 동적 변경
     * 런타임에 hidden, disabled 등을 변경할 때 사용
     */
    setFieldUI: (key, patch) => {
      set((state) => {
        const next = produce(state.ui.fieldUI, (draft) => {
          draft[key] = { ...(draft[key] ?? {}), ...patch };
        });

        return { ui: { ...state.ui, fieldUI: next } };
      });
    },

    /**
     * 특정 필드로 포커스 이동
     * 마지막 포커스 요청 이벤트를 갱신한다.
     */
    requestFieldFocus: (key) => {
      set((state) => {
        const prevRequestId = state.ui.focusRequest?.requestId ?? 0;
        return {
          ui: {
            ...state.ui,
            focusRequest: { key, requestId: prevRequestId + 1 },
          },
        };
      });
    },

    /**
     * 폼 초기화
     */
    resetForm: () => {
      set((state) => ({
        data: {
          formData: structuredClone(initialFormValues),
          original: state.data.original,
          dirtyKeys: {},
          dirtyCount: 0,
          hasChanges: false,
        },
        ui: {
          ...state.ui,
          fieldUI: {},
          focusRequest: null,
        },
      }));
    },

    /**
     * 필드 이벤트 처리
     * change 이벤트: 값 반영 후 핸들러 실행
     * blur/focus 이벤트: 핸들러만 실행
     */
    onFieldEvent: (event, key, value) => {
      // change 이벤트일 때만 값 반영
      if (event === "change" && value !== undefined) {
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
      const name = get().data.formData.base.name ?? "";
      actions.setValue("base.displayName", name);
    },

    /**
     * 마진율 계산
     * 마진율 = (판매가 - 공급가) / 판매가 * 100
     */
    calculateMargin: () => {
      const { salePrice = 0, fee = 0 } = get().data.formData.price;
      if (salePrice > 0) {
        const marginRate = Math.round(((salePrice - fee) / salePrice) * 100);
        actions.setValue("price.marginRate", marginRate);
      } else {
        actions.setValue("price.marginRate", 0);
      }
    },

    /**
     * 상품코드 유효성 검사 (예시)
     */
    validatePrdCd: async () => {
      const code = get().data.formData.base.code ?? "";

      // 영문/숫자만 허용
      const { isValid, errorMessage } = await mockValidateCode(code);

      if (!isValid && code.length > 0) {
        // 유효하지 않으면 에러 표시 (helpText 활용)
        actions.setFieldUI("base.code", {
          errorMessage,
        });
        actions.requestFieldFocus("base.code");

        return false;
      }

      // 유효하면 에러 상태 해제
      actions.setFieldUI("base.code", {
        errorMessage: undefined,
      });

      return true;
    },
  };

  return {
    data: {
      formData: structuredClone(initialFormValues),
      original: structuredClone(initialFormValues),
      dirtyKeys: {},
      dirtyCount: 0,
      hasChanges: false,
    },
    ui: {
      schemas: fieldSchemas,
      fieldUI: {},
      focusRequest: null,
    },
    actions,
  };
});

// ===== Selector Hooks =====
// 필드 단위 구독으로 성능 최적화

/**
 * 특정 필드 값만 구독
 */
export function useFieldValue<K extends DataKey>(key: K): PathValue<K> {
  return useFormStore(
    useShallow((state) => _.get(state.data.formData, key) as PathValue<K>),
  );
}

/**
 * 특정 필드 스키마만 구독
 */
export function useFieldSchema(key: DataKey) {
  return useFormStore(useShallow((state) => state.ui.schemas[key]));
}

/**
 * 특정 필드의 런타임 UI 속성만 구독
 */
export function useFieldUI(key: DataKey): Partial<FieldUIProps> | undefined {
  return useFormStore(useShallow((state) => state.ui.fieldUI[key]));
}

export function useLastFocusRequest() {
  return useFormStore((state) => state.ui.focusRequest);
}

/**
 * 액션만 구독 (리렌더 방지)
 */
export function useFormActions() {
  return useFormStore(useShallow((state) => state.actions));
}

/**
 * 필드 이벤트 핸들러 훅
 */
export function useFieldEventHandler<K extends DataKey>(key: K) {
  const actions = useFormActions();

  return {
    onChange: (value: unknown) =>
      actions.onFieldEvent("change", key, value as PathValue<K>),
    onBlur: () => actions.onFieldEvent("blur", key),
    onFocus: () => actions.onFieldEvent("focus", key),
  };
}
