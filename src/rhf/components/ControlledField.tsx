import { useController, useFormContext } from 'react-hook-form';
import { FormField } from '@/components/FormField';
import type { FieldRuleHandlers, ProductFieldMeta, ProductFormValues } from '../types';

type ControlledFieldProps = {
  meta: ProductFieldMeta;
  overrides?: Partial<ProductFieldMeta['ui']>;
  rules?: FieldRuleHandlers;
};

export function ControlledField({ meta, overrides, rules }: ControlledFieldProps) {
  const { control } = useFormContext<ProductFormValues>();
  const { field, fieldState } = useController({
    control,
    name: meta.name,
  });

  const ui = { ...meta.ui, ...(overrides ?? {}) };

  return (
    <FormField
      label={ui.label}
      required={ui.required}
      disabled={ui.disabled}
      hidden={ui.hidden}
      maxLength={ui.maxLength}
      placeholder={ui.placeholder}
      helpText={ui.helpText}
      errorMessage={fieldState.error?.message}
      inputRef={field.ref}
      fieldType={ui.fieldType}
      options={ui.options}
      value={field.value}
      onChange={(value) => {
        field.onChange(value);
        rules?.onChange?.(value);
      }}
      onBlur={() => {
        field.onBlur();
        void rules?.onBlur?.();
      }}
    />
  );
}
