import type { FieldUIProps } from "../types/form";
import type { FocusableElement } from "../store/focusRegistry";

type FormFieldProps = {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  maxLength?: number;
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  inputRef?: (element: FocusableElement | null) => void;
  fieldType?: FieldUIProps["fieldType"];
  options?: FieldUIProps["options"];
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

/**
 * 기본 폼 필드 컴포넌트
 */
export function FormField({
  label,
  required,
  disabled,
  hidden,
  maxLength,
  placeholder,
  helpText,
  errorMessage,
  inputRef,
  fieldType = "text",
  options,
  value,
  onChange,
  onBlur,
  onFocus,
}: FormFieldProps) {
  if (hidden) return null;

  const baseInputClass = `
    w-full px-3 py-2 
    border border-gray-300 rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed disabled:border-gray-200
    transition-colors duration-200
  `;

  const renderInput = () => {
    switch (fieldType) {
      case "number":
        return (
          <input
            ref={inputRef}
            type="number"
            className={baseInputClass}
            value={(value as number) ?? ""}
            onChange={(e) =>
              onChange(e.target.value ? Number(e.target.value) : 0)
            }
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled}
            placeholder={placeholder}
          />
        );

      case "select":
        return (
          <select
            ref={inputRef}
            className={baseInputClass}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled}
          >
            <option value="">선택하세요</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <label className="flex items-center cursor-pointer">
            <input
              ref={inputRef}
              type="checkbox"
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              onBlur={onBlur}
              onFocus={onFocus}
              disabled={disabled}
            />
            <span className="ml-2 text-gray-700">{label}</span>
          </label>
        );

      case "textarea":
        return (
          <textarea
            ref={inputRef}
            className={`${baseInputClass} resize-none min-h-[100px]`}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        );

      default:
        return (
          <input
            ref={inputRef}
            type="text"
            className={baseInputClass}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        );
    }
  };

  // checkbox는 레이아웃이 다름
  if (fieldType === "checkbox") {
    return (
      <div className="py-2">
        {renderInput()}

        {/* 에러 메시지 */}
        {errorMessage && <ErrorMessage errorMessage={errorMessage} />}

        {helpText && <HelpText helpText={helpText} />}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* 필드 라벨 */}
      {label && (
        <label className="flex items-center text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* 필드 컴포넌트 */}
      {renderInput()}

      {/* 에러 메시지 */}
      {errorMessage && <ErrorMessage errorMessage={errorMessage} />}

      {/* 도움말 */}
      {helpText && <HelpText helpText={helpText} />}

      {/* 길이 제한 */}
      {maxLength && fieldType !== "number" && (
        <p className="text-xs text-gray-400 text-right">
          {String(value ?? "").length} / {maxLength}
        </p>
      )}
    </div>
  );
}

const ErrorMessage = ({ errorMessage }: { errorMessage?: string }) => {
  return <p className="text-sm text-red-500">{errorMessage}</p>;
};

const HelpText = ({ helpText }: { helpText?: string }) => {
  return <p className="text-sm text-gray-500">{helpText}</p>;
};
