# Zustand Big Form Sample

> README.md 문서를 기반으로 구현된 복잡한 폼 관리 샘플 프로젝트

## 📦 기술 스택

- **React 18** + **TypeScript**
- **Zustand** - 상태 관리
- **TailwindCSS** - 스타일링
- **type-fest** - Paths 타입 유틸리티
- **Vite** - 빌드 도구

## 🚀 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 🏗️ 프로젝트 구조

```
src/
├── types/
│   └── form.ts          # 타입 정의 (DataKey, FieldSchema 등)
├── store/
│   ├── index.ts         # Zustand 스토어 + selector hooks
│   ├── schemas.ts       # 필드 스키마 (UI + 이벤트)
│   └── initialValues.ts # 폼 초기값
├── components/
│   ├── FormField.tsx    # 기본 폼 필드 컴포넌트
│   ├── SchemaField.tsx  # 스키마 기반 필드 (핵심)
│   └── AutoForm.tsx     # 자동 폼 생성
└── pages/
    └── FormPage.tsx     # 폼 페이지
```

## 🎯 핵심 설계 원칙

### 1. 스키마와 데이터 분리

```typescript
// schemas.ts - UI만 관리
export const fieldSchemas: Record<DataKey, FieldSchema> = {
  'base.name': {
    key: 'base.name',
    ui: { label: '상품명', required: true, maxLength: 80 },
    events: { ... }
  },
};

// initialValues.ts - 초기값만 관리
export const initialFormValues: FormData = {
  base: { name: '', displayName: '' },
};
```

**효과:**
- 값 변경 시 스키마 업데이트 불필요 → 성능 개선
- 책임 분리 → 유지보수 용이

### 2. 이벤트 핸들러를 스키마에 포함

```typescript
'base.name': {
  key: 'base.name',
  ui: { label: '상품명' },
  events: {
    change: (actions, get) => {
      actions.syncDisplayName();
    },
    blur: (actions, get) => {
      const name = get().data.formData.base.name?.trim() ?? '';
      actions.setValue('base.name', name);
    },
  },
},
```

**왜 `(actions, get) => ...` 형태인가?**
- 스키마 파일에서 actions를 직접 참조하면 순환 참조 발생
- 스토어 생성 시점에 actions와 get을 주입받아 실행
- IDE 리팩토링(함수 이름 변경 등)이 정상 작동

### 3. 필드 단위 구독으로 성능 최적화

```typescript
export function SchemaField({ fieldKey }: { fieldKey: DataKey }) {
  // 각각 독립적으로 구독 → 다른 필드 변경 시 리렌더 방지
  const schema = useFieldSchema(fieldKey);
  const runtimeUI = useFieldUI(fieldKey);
  const value = useFieldValue(fieldKey);
  const { onChange, onBlur } = useFieldEventHandler(fieldKey);
  // ...
}
```

100개 이상의 필드가 있을 때, 하나의 필드가 변경될 때마다 전체 폼이 리렌더되면 성능 문제가 발생합니다.
Zustand의 selector를 활용해 필드별로 필요한 상태만 구독합니다.

## 📋 구현된 기능

- [x] 스키마 기반 폼 필드 렌더링
- [x] 필드 단위 상태 구독 (성능 최적화)
- [x] 이벤트 핸들러 스키마 통합
- [x] 런타임 UI 속성 변경 (hidden, disabled 등)
- [x] 연쇄적 비즈니스 로직 (이름→표시명 동기화, 마진율 계산 등)
- [x] 폼 초기화 및 변경 감지
- [x] 디버그 패널 (실시간 상태 확인)

## 🔧 활용 예시

### 필드 추가하기

1. `types/form.ts`에서 FormData 타입 확장
2. `store/initialValues.ts`에서 초기값 추가
3. `store/schemas.ts`에서 스키마 정의
4. 페이지에서 DataKey 배열에 추가

### 연쇄 로직 추가하기

```typescript
// schemas.ts
'price.salePrice': {
  key: 'price.salePrice',
  ui: { label: '판매가' },
  events: {
    change: (actions) => {
      actions.calculateMargin(); // 마진율 자동 계산
    },
  },
},
```

### 조건부 UI 변경

```typescript
// schemas.ts
'delivery.type': {
  key: 'delivery.type',
  ui: { label: '배송유형' },
  events: {
    change: (actions, get) => {
      if (get().data.formData.delivery.type === 'pickup') {
        actions.setFieldUI('delivery.cost', { hidden: true });
      }
    },
  },
},
```

## 📚 참고 문서

- [READ.md](./README.md) - 설계 배경 및 개선 방안
