# 복잡한 폼 관리 개선 가이드

> 레거시 시스템을 모던 스택(React + TypeScript + Zustand)으로 컨버전하는 과정에서 얻은 경험과 개선 방안을 정리한 문서입니다.
> 샘플 코드에 대한 설명은 [SAMPLE.md](./SAMPLE.md)에 있습니다.

---

## 1. 배경

레거시 시스템을 React로 컨버전하면서 다음과 같은 상황을 마주했습니다.

- **복잡한 폼**: 100개 이상의 입력 필드
- **연쇄적인 비즈니스 로직**: 필드 변경 시 다른 필드 자동 계산, API 호출, UI 상태 변경 등
- **빈번한 UI 상태 변경**: 필드별 숨김/표시, 활성화/비활성화, 라벨 변경 등
- **촉박한 일정**: 기존 로직을 완전히 재설계할 시간이 없어 대부분 그대로 옮겨야 하는 상황

이런 상황에서 **Zustand**를 선택해 상태 관리를 구현했고, 프로젝트를 마친 후 복기하며 개선점을 정리했습니다.

---

## 2. 직면한 문제들

### 2.1 타입 안정성 부족

`DataKey`를 `Paths<FormData>`로 정의해 사용했으나, 런타임 검증이 없어 실제 데이터와 타입이 불일치할 수 있었습니다.

> **`Paths` 타입 유틸리티란?**  
> [`type-fest`](https://github.com/sindresorhus/type-fest) 라이브러리에서 제공하는 타입 유틸리티입니다. 중첩된 객체의 모든 경로를 문자열 리터럴 유니온 타입으로 추출합니다.
> 
> ```typescript
> import { Paths } from 'type-fest';
> 
> type FormData = {
>   base: { name?: string; displayName?: string; };
>   settings: { theme?: 'light' | 'dark'; };
> };
> 
> type DataKey = Paths<FormData>;
> // 결과: "base" | "base.name" | "base.displayName" | "settings" | "settings.theme"
> ```
> 
> **장점**: 중첩 객체 경로 자동 추출, 컴파일 타임 타입 체크  
> **단점**: 런타임 검증 없음, 복잡한 타입에서 추론 느려짐

### 2.2 스키마와 데이터의 책임 혼재

스키마에 `value` 속성을 두고 `formData`와 동기화하는 프록시 로직을 사용했습니다. 필드 정의와 초기값을 한 곳에서 볼 수 있어 편했지만, 다음 문제가 생겼습니다.

- **성능**: 값 변경 시 스키마도 함께 업데이트되어 불필요한 리렌더링 발생
- **복잡도**: 동기화 로직으로 데이터 관리의 복잡도 증가
- **책임 분리 부족**: 스키마가 UI 정의와 데이터 저장을 모두 담당

### 2.3 이벤트 핸들러의 분산

필드별 `onChange`, `onBlur` 로직이 컴포넌트나 스토어 여기저기에 흩어져 있어, 특정 필드의 동작을 파악하려면 여러 파일을 오가야 했습니다.

---

## 3. 해결 방안

### 3.1 스키마와 데이터 분리

스키마는 **UI 정의만** 담당하고, 데이터는 별도로 관리합니다.

```typescript
// store/schemas.ts - UI만 관리
export const fieldSchemas: Record<DataKey, FieldSchema> = {
  'base.name': {
    key: 'base.name',
    ui: { label: '이름', required: true, maxLength: 80 },
  },
  'base.displayName': {
    key: 'base.displayName',
    ui: { label: '표시명', required: true, maxLength: 80 },
  },
};

// store/initialValues.ts - 초기값만 관리
export const initialFormValues: FormData = {
  base: { name: '', displayName: '' },
};
```

**효과**:
- 값 변경 시 스키마 업데이트 불필요 → 성능 개선
- 프록시 로직 제거 → 복잡도 감소
- 책임 분리 → 유지보수 용이

### 3.2 이벤트 핸들러를 스키마에 포함

필드의 모든 정보(UI, 이벤트)를 스키마에서 한눈에 볼 수 있도록 이벤트 핸들러를 스키마에 포함합니다.

```typescript
// store/schemas.ts
type EventHandler = (
  actions: StoreActions,
  get: () => StoreState & { actions: StoreActions }
) => void | Promise<void>;

export const fieldSchemas: Record<DataKey, FieldSchema> = {
  'base.name': {
    key: 'base.name',
    ui: { label: '이름', required: true, maxLength: 80 },
    events: {
      // 이름 변경 시 표시명 자동 동기화 + trim
      change: (actions, get) => {
        actions.syncDisplayName();
      },
      blur: (actions, get) => {
        const name = get().data.formData.base.name?.trim() ?? '';
        actions.setValue('base.name', name);
      },
    },
  },
  'base.displayName': {
    key: 'base.displayName',
    ui: { label: '표시명', required: true, maxLength: 80 },
    // 이벤트가 없으면 생략
  },
};
```

**왜 `(actions, get) => ...` 형태인가?**
- 스키마 파일에서 `actions`를 직접 참조하면 순환 참조 발생
- 스토어 생성 시점에 `actions`와 `get`을 주입받아 실행
- IDE 리팩토링(함수 이름 변경 등)이 정상 작동

**효과**:
- 필드별 동작을 스키마에서 바로 확인 가능
- 이벤트 로직이 흩어지지 않음

### 3.3 필드 단위 구독으로 성능 최적화

100개 이상의 필드가 있을 때, 하나의 필드가 변경될 때마다 전체 폼이 리렌더되면 성능 문제가 생깁니다. Zustand의 selector를 활용해 **필드별로 필요한 상태만 구독**합니다.

```typescript
export function SchemaField({ fieldKey }: { fieldKey: DataKey }) {
  // 각각 독립적으로 구독 → 다른 필드 변경 시 리렌더 방지
  const schema = useStore((s) => s.ui.schemas[fieldKey]);
  const runtimeUI = useStore((s) => s.ui.fieldUI[fieldKey]);
  const value = useStore((s) => _.get(s.data.formData, fieldKey));
  const actions = useStore((s) => s.actions);

  const ui = { ...schema.ui, ...(runtimeUI ?? {}) };

  if (schema.render) return schema.render({ key: fieldKey });
  if (ui.hidden) return null;

  return (
    <FormField
      label={ui.label}
      required={ui.required}
      disabled={ui.disabled}
      maxLength={ui.maxLength}
      value={value}
      onChange={(v) => actions.onFieldEvent('change', fieldKey, v)}
      onBlur={() => actions.onFieldEvent('blur', fieldKey, value)}
    />
  );
}
```

---

## 4. 최종 권장 설계

### 4.1 타입 정의

```typescript
// types/form.ts
type DataKey = 'base.name' | 'base.displayName';

type FormData = {
  base: {
    name?: string;
    displayName?: string;
  };
};

type FieldUIProps = {
  label?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  maxLength?: number;
};

type FieldEvent = 'change' | 'blur';

type EventHandler = (
  actions: StoreActions,
  get: () => StoreState & { actions: StoreActions }
) => void | Promise<void>;

type FieldSchema = {
  key: DataKey;
  ui: FieldUIProps;
  events?: Partial<Record<FieldEvent, EventHandler>>;
  render?: (ctx: { key: DataKey }) => JSX.Element; // 탈출구
};
```

### 4.2 스키마 (UI + 이벤트)

```typescript
// store/schemas.ts
export const fieldSchemas: Record<DataKey, FieldSchema> = {
  'base.name': {
    key: 'base.name',
    ui: { label: '이름', required: true, maxLength: 80 },
    events: {
      change: (actions) => {
        actions.syncDisplayName();
      },
      blur: (actions, get) => {
        const name = get().data.formData.base.name?.trim() ?? '';
        actions.setValue('base.name', name);
      },
    },
  },
  'base.displayName': {
    key: 'base.displayName',
    ui: { label: '표시명', required: true, maxLength: 80 },
  },
};
```

### 4.3 초기값 (데이터)

```typescript
// store/initialValues.ts
export const initialFormValues: FormData = {
  base: { name: '', displayName: '' },
};
```

### 4.4 스토어

```typescript
// store/index.ts
import create from 'zustand';
import _ from 'lodash';
import { fieldSchemas } from './schemas';
import { initialFormValues } from './initialValues';

type StoreState = {
  data: { formData: FormData };
  ui: {
    schemas: Record<DataKey, FieldSchema>;
    fieldUI: Partial<Record<DataKey, FieldUIProps>>;
  };
};

type StoreActions = {
  setValue: (key: DataKey, value: any) => void;
  setFieldUI: (key: DataKey, patch: Partial<FieldUIProps>) => void;
  syncDisplayName: () => void;
  onFieldEvent: (event: FieldEvent, key: DataKey, value: any) => void;
};

export const useStore = create<StoreState & { actions: StoreActions }>((set, get) => {
  const actions: StoreActions = {
    setValue: (key, value) => {
      set((s) => {
        const next = structuredClone(s.data.formData);
        _.set(next, key, value);
        return { data: { formData: next } };
      });
    },

    setFieldUI: (key, patch) => {
      set((s) => ({
        ui: {
          ...s.ui,
          fieldUI: { ...s.ui.fieldUI, [key]: { ...(s.ui.fieldUI[key] ?? {}), ...patch } },
        },
      }));
    },

    syncDisplayName: () => {
      const name = get().data.formData.base.name ?? '';
      actions.setValue('base.displayName', name);
    },

    onFieldEvent: (event, key, value) => {
      // 1) 값 반영
      actions.setValue(key, value);

      // 2) 스키마에서 이벤트 핸들러 가져와 실행
      const handler = fieldSchemas[key]?.events?.[event];
      if (handler) {
        handler(actions, get);
      }
    },
  };

  return {
    data: { formData: initialFormValues },
    ui: { schemas: fieldSchemas, fieldUI: {} },
    actions,
  };
});
```

### 4.5 필드 컴포넌트

```typescript
// components/SchemaField.tsx
export function SchemaField({ fieldKey }: { fieldKey: DataKey }) {
  const schema = useStore((s) => s.ui.schemas[fieldKey]);
  const runtimeUI = useStore((s) => s.ui.fieldUI[fieldKey]);
  const value = useStore((s) => _.get(s.data.formData, fieldKey));
  const actions = useStore((s) => s.actions);

  const ui = { ...schema.ui, ...(runtimeUI ?? {}) };

  if (ui.hidden) return null;
  
  if (schema.render) return schema.render({ key: fieldKey });

  return (
    <FormField
      label={ui.label}
      required={ui.required}
      disabled={ui.disabled}
      maxLength={ui.maxLength}
      value={value}
      onChange={(v) => actions.onFieldEvent('change', fieldKey, v)}
      onBlur={() => actions.onFieldEvent('blur', fieldKey, value)}
    />
  );
}

// components/AutoForm.tsx
export function AutoForm({ keys }: { keys: DataKey[] }) {
  return (
    <>
      {keys.map((k) => (
        <SchemaField key={k} fieldKey={k} />
      ))}
    </>
  );
}
```

### 4.6 사용 예시

```typescript
// pages/FormPage.tsx
export function FormPage() {
  const fieldKeys: DataKey[] = ['base.name', 'base.displayName'];

  return (
    <form>
      <AutoForm keys={fieldKeys} />
    </form>
  );
}
```

---

## 5. 핵심 설계 원칙

1. **스키마는 UI + 이벤트**: 필드의 모든 정보를 한 곳에서 관리
2. **데이터는 분리**: 초기값은 별도 파일로 관리
3. **이벤트 핸들러는 `(actions, get) => ...` 형태**: 순환 참조 방지, IDE 리팩토링 지원
4. **필드 단위 구독**: 성능 최적화 (100+ 필드에서도 안정적)
5. **탈출구 제공**: 특이 케이스는 `render` prop으로 커스텀

---

## 6. 결론

주어진 상황에서 **Zustand 단독 사용**은 합리적인 선택이었습니다. 

`react-hook-form`과 조합하는 방법도 있지만, 복잡한 UI 상태와 연쇄 비즈니스 로직을 함께 관리해야 하는 상황에서는 단일 상태 관리가 더 단순합니다.

다만 프로젝트를 마치고 돌아보니, 앞서 언급했던 사항 중 **스키마와 데이터 분리**는 처음부터 적용했다면 더 좋았을 것 같습니다.
