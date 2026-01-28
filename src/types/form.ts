import type { Paths } from 'type-fest';

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
    original: FormData;
  };
  ui: {
    schemas: Record<string, FieldSchema>;
    fieldUI: Partial<Record<DataKey, Partial<FieldUIProps>>>;
  };
};

/**
 * 스토어 액션 타입
 */
export type StoreActions = {
  // 값 설정
  setValue: (key: DataKey, value: unknown) => void;
  // 여러 값 한번에 설정
  setValues: (values: { key: DataKey; value: unknown }[]) => void;
  // 필드 UI 속성 변경
  setFieldUI: (key: DataKey, patch: Partial<FieldUIProps>) => void;
  // 폼 초기화
  resetForm: () => void;
  // 변경 여부 확인
  hasChanges: () => boolean;
  // 필드 이벤트 실행
  onFieldEvent: (event: FieldEvent, key: DataKey, value?: unknown) => void;

  // 비즈니스 로직 액션들
  syncDisplayName: () => void;
  calculateMargin: () => void;
  validateCode: () => Promise<boolean>;
};

/**
 * 전체 스토어 타입
 */
export type FormStore = StoreState & { actions: StoreActions };
