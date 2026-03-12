import type { Get, Paths } from 'type-fest';

/**
 * 폼 데이터 타입 정의
 * 실제 프로젝트에서는 더 복잡한 중첩 구조를 가질 수 있음
 */
export type FormData = {
  base: {
    name?: string;
    displayName?: string;
    code?: string;
  };
  price: {
    salePrice?: number;
    fee?: number;
    marginRate?: number;
  };
  delivery: {
    type?: 'standard' | 'express' | 'pickup';
    cost?: number;
    freeThreshold?: number;
  };
  options: {
    isActive?: boolean;
    memo?: string;
  };
};

/**
 * FormData의 모든 가능한 경로를 추출한 타입
 * type-fest의 Paths 유틸리티 사용
 */
export type DataKey = Paths<FormData>;

/**
 * 경로 키에 해당하는 값 타입
 */
export type PathValue<K extends DataKey> = Get<FormData, K>;

export type ValueEntry = {
  [K in DataKey]: {
    key: K;
    value: PathValue<K>;
  };
}[DataKey];

/**
 * 필드 UI 속성 타입
 */
export type FieldUIProps = {
  label?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  fieldType?: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  options?: { label: string; value: string | number }[];
};

/**
 * 필드 이벤트 타입
 */
export type FieldEvent = 'change' | 'blur' | 'focus';

/**
 * 이벤트 핸들러 타입
 * actions와 get을 주입받아 순환 참조 방지
 */
export type EventHandler = (
  actions: StoreActions,
  get: () => StoreState & { actions: StoreActions }
) => void | Promise<void>;

/**
 * 필드 스키마 타입
 * UI 정의 + 이벤트 핸들러
 */
export type FieldSchema = {
  key: DataKey;
  ui: FieldUIProps;
  events?: Partial<Record<FieldEvent, EventHandler>>;
  render?: (ctx: { key: DataKey }) => React.ReactNode;
};

/**
 * 스토어 상태 타입
 */
export type StoreState = {
  data: {
    formData: FormData;
    /** 초기 로드 시점의 스냅샷. dirty 비교 기준으로 사용되며 런타임에 변경하지 않는다. */
    original: FormData;
    dirtyKeys: Partial<Record<DataKey, true>>;
    dirtyCount: number;
    hasChanges: boolean;
  };
  ui: {
    /** 선언적 필드 정의(불변). UI 기본값 + 이벤트 핸들러를 보관하며 런타임에 변경하지 않는다. */
    schemas: Record<string, FieldSchema>;
    /** 런타임 UI 오버라이드. setFieldUI로 동적 변경되며, 렌더 시 schemas.ui 위에 병합된다. */
    fieldUI: Partial<Record<DataKey, Partial<FieldUIProps>>>;
    /** 마지막 포커스 요청 이벤트. requestId는 동일 key 재요청을 구분하기 위한 증가값. */
    focusRequest: { key: DataKey; requestId: number } | null;
  };
};

/**
 * 스토어 액션 타입
 */
export type StoreActions = {
  // 값 설정
  setValue: <K extends DataKey>(key: K, value: PathValue<K>) => void;
  // 여러 값 한번에 설정
  setValues: (values: ValueEntry[]) => void;
  // 필드 UI 속성 변경
  setFieldUI: (key: DataKey, patch: Partial<FieldUIProps>) => void;
  // 특정 필드 포커스 요청
  requestFieldFocus: (key: DataKey) => void;
  // 폼 초기화
  resetForm: () => void;
  // 필드 이벤트 실행
  onFieldEvent: <K extends DataKey>(
    event: FieldEvent,
    key: K,
    value?: PathValue<K>
  ) => void;

  // 비즈니스 로직 액션들
  syncDisplayName: () => void;
  calculateMargin: () => void;
  validatePrdCd: () => Promise<boolean>;
};

/**
 * 전체 스토어 타입
 */
export type FormStore = StoreState & { actions: StoreActions };
