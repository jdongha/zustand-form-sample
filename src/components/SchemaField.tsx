import { useMemo } from 'react';
import type { DataKey } from '../types/form';
import {
  useFieldValue,
  useFieldSchema,
  useFieldUI,
  useFieldEventHandler,
} from '../store';
import { FormField } from './FormField';
import type { FieldRefManager } from '../store/focusRegistry';

type SchemaFieldProps = {
  fieldKey: DataKey;
  refManager: FieldRefManager;
};

/**
 * 스키마 기반 필드 컴포넌트
 *
 * 핵심 설계:
 * - 각 상태를 독립적으로 구독 → 다른 필드 변경 시 리렌더 방지
 * - 스키마의 ui + 런타임 fieldUI를 병합하여 최종 UI 속성 결정
 * - render prop이 있으면 커스텀 렌더링 (탈출구)
 */
export function SchemaField({ fieldKey, refManager }: SchemaFieldProps) {
  // 각각 독립적으로 구독 (성능 최적화)
  const schema = useFieldSchema(fieldKey);
  const runtimeUI = useFieldUI(fieldKey);
  const value = useFieldValue(fieldKey);
  const { onChange, onBlur, onFocus } = useFieldEventHandler(fieldKey);
  const handleInputRef = useMemo(
    () => refManager.register(fieldKey),
    [refManager, fieldKey],
  );

  // 스키마가 없으면 렌더링하지 않음
  if (!schema) {
    console.warn(`Schema not found for key: ${fieldKey}`);
    return null;
  }

  // 스키마 UI + 런타임 UI 병합
  const ui = { ...schema.ui, ...(runtimeUI ?? {}) };

  // 숨김 처리
  if (ui.hidden) return null;

  // 커스텀 렌더링 (탈출구)
  if (schema.render) {
    return <>{schema.render({ key: fieldKey })}</>;
  }

  return (
    <FormField
      label={ui.label}
      required={ui.required}
      disabled={ui.disabled}
      hidden={ui.hidden}
      maxLength={ui.maxLength}
      placeholder={ui.placeholder}
      errorMessage={ui.errorMessage}
      helpText={ui.helpText}
      inputRef={handleInputRef}
      fieldType={ui.fieldType}
      options={ui.options}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  );
}
