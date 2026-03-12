import type { DataKey, FieldSchema } from '../types/form';

/**
 * 폼 필드 스키마 정의
 * UI 속성 + 이벤트 핸들러를 한 곳에서 관리
 *
 * 이벤트 핸들러는 (actions, get) => ... 형태로 정의
 * - 순환 참조 방지
 * - IDE 리팩토링 지원
 */
export const fieldSchemas: Record<DataKey, FieldSchema> = {
  // ===== 기본정보 =====
  base: {
    key: 'base',
    ui: { label: '기본정보' },
  },

  'base.name': {
    key: 'base.name',
    ui: {
      label: '상품명',
      required: true,
      maxLength: 80,
      placeholder: '상품명을 입력하세요',
      helpText: '최대 80자까지 입력 가능합니다',
    },
    events: {
      // 상품명 변경 시 표시명 자동 동기화
      change: (actions) => {
        actions.syncDisplayName();
      },
      // blur 시 공백 제거
      blur: (actions, get) => {
        const name = get().data.formData.base.name?.trim() ?? '';
        actions.setValue('base.name', name);
      },
    },
  },

  'base.displayName': {
    key: 'base.displayName',
    ui: {
      label: '표시명',
      required: true,
      maxLength: 80,
      placeholder: '화면에 표시될 상품명',
    },
  },

  'base.code': {
    key: 'base.code',
    ui: {
      label: '상품코드',
      required: true,
      maxLength: 20,
      placeholder: '영문/숫자만 입력',
    },
    events: {
      blur: async (actions) => {
        await actions.validatePrdCd();
      },
    },
  },

  // ===== 가격정보 =====
  price: {
    key: 'price',
    ui: { label: '가격정보' },
  },

  'price.salePrice': {
    key: 'price.salePrice',
    ui: {
      label: '판매가',
      required: true,
      fieldType: 'number',
      helpText: '소비자에게 노출되는 가격',
    },
    events: {
      change: (actions) => {
        actions.calculateMargin();
      },
    },
  },

  'price.fee': {
    key: 'price.fee',
    ui: {
      label: '공급가',
      required: true,
      fieldType: 'number',
      helpText: '정산 시 협력사가 받는 금액',
    },
    events: {
      change: (actions) => {
        actions.calculateMargin();
      },
    },
  },

  'price.marginRate': {
    key: 'price.marginRate',
    ui: {
      label: '마진율',
      disabled: true,
      fieldType: 'number',
      helpText: '자동 계산됨',
    },
  },

  // ===== 배송정보 =====
  delivery: {
    key: 'delivery',
    ui: { label: '배송정보' },
  },

  'delivery.type': {
    key: 'delivery.type',
    ui: {
      label: '배송유형',
      required: true,
      fieldType: 'select',
      options: [
        { label: '일반배송', value: 'standard' },
        { label: '빠른배송', value: 'express' },
        { label: '픽업', value: 'pickup' },
      ],
    },
    events: {
      change: (actions, get) => {
        const type = get().data.formData.delivery.type;
        // 픽업인 경우 배송비 관련 필드 숨김
        if (type === 'pickup') {
          actions.setFieldUI('delivery.cost', { hidden: true });
          actions.setFieldUI('delivery.freeThreshold', { hidden: true });
          actions.setValue('delivery.cost', 0);
          actions.setValue('delivery.freeThreshold', 0);
        } else {
          actions.setFieldUI('delivery.cost', { hidden: false });
          actions.setFieldUI('delivery.freeThreshold', { hidden: false });
        }
      },
    },
  },

  'delivery.cost': {
    key: 'delivery.cost',
    ui: {
      label: '배송비',
      fieldType: 'number',
      helpText: '0원이면 무료배송',
    },
    events: {
      change: (actions, get) => {
        const cost = get().data.formData.delivery.cost ?? 0;
        // 배송비가 0이면 무료배송이므로 면제기준 숨김
        if (cost === 0) {
          actions.setFieldUI('delivery.freeThreshold', { hidden: true });
          actions.setValue('delivery.freeThreshold', 0);
        } else {
          actions.setFieldUI('delivery.freeThreshold', { hidden: false });
        }
      },
    },
  },

  'delivery.freeThreshold': {
    key: 'delivery.freeThreshold',
    ui: {
      label: '무료배송 기준금액',
      fieldType: 'number',
      hidden: true,
      helpText: '이 금액 이상 구매 시 무료배송',
    },
  },

  // ===== 옵션 =====
  options: {
    key: 'options',
    ui: { label: '기타설정' },
  },

  'options.isActive': {
    key: 'options.isActive',
    ui: {
      label: '활성화',
      fieldType: 'checkbox',
    },
  },

  'options.memo': {
    key: 'options.memo',
    ui: {
      label: '메모',
      fieldType: 'textarea',
      maxLength: 500,
      placeholder: '관리용 메모를 입력하세요',
    },
  },
};
