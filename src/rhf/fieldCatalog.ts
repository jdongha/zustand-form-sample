import type { ProductFieldMeta, ProductFieldName, ProductSectionConfig } from './types';

export const productFieldCatalog: Record<ProductFieldName, ProductFieldMeta> = {
  'base.name': {
    name: 'base.name',
    ui: {
      label: '상품명',
      required: true,
      maxLength: 80,
      placeholder: '상품명을 입력하세요',
      helpText: '최대 80자까지 입력 가능합니다',
    },
  },
  'base.displayName': {
    name: 'base.displayName',
    ui: {
      label: '표시명',
      required: true,
      maxLength: 80,
      placeholder: '화면에 표시될 상품명',
    },
  },
  'base.code': {
    name: 'base.code',
    ui: {
      label: '상품코드',
      required: true,
      maxLength: 20,
      placeholder: '영문/숫자만 입력',
    },
  },
  'price.salePrice': {
    name: 'price.salePrice',
    ui: {
      label: '판매가',
      required: true,
      fieldType: 'number',
      helpText: '소비자에게 노출되는 가격',
    },
  },
  'price.fee': {
    name: 'price.fee',
    ui: {
      label: '공급가',
      required: true,
      fieldType: 'number',
      helpText: '정산 시 협력사가 받는 금액',
    },
  },
  'price.marginRate': {
    name: 'price.marginRate',
    ui: {
      label: '마진율',
      fieldType: 'number',
      disabled: true,
      helpText: '자동 계산됨',
    },
  },
  'delivery.type': {
    name: 'delivery.type',
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
  },
  'delivery.cost': {
    name: 'delivery.cost',
    ui: {
      label: '배송비',
      fieldType: 'number',
      helpText: '0원이면 무료배송',
    },
  },
  'delivery.freeThreshold': {
    name: 'delivery.freeThreshold',
    ui: {
      label: '무료배송 기준금액',
      fieldType: 'number',
      helpText: '이 금액 이상 구매 시 무료배송',
    },
  },
  'options.isActive': {
    name: 'options.isActive',
    ui: {
      label: '활성화',
      fieldType: 'checkbox',
    },
  },
  'options.memo': {
    name: 'options.memo',
    ui: {
      label: '메모',
      fieldType: 'textarea',
      maxLength: 500,
      placeholder: '관리용 메모를 입력하세요',
    },
  },
};

export const productFormSections: ProductSectionConfig[] = [
  {
    id: 'base',
    title: '📦 기본정보',
    fields: ['base.name', 'base.displayName', 'base.code'],
  },
  {
    id: 'price',
    title: '💰 가격정보',
    fields: ['price.salePrice', 'price.fee', 'price.marginRate'],
  },
  {
    id: 'delivery',
    title: '🚚 배송정보',
    fields: ['delivery.type', 'delivery.cost', 'delivery.freeThreshold'],
  },
  {
    id: 'options',
    title: '⚙️ 기타설정',
    fields: ['options.isActive', 'options.memo'],
  },
];
