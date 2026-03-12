import type { DataKey } from '../types/form';
import { SchemaField } from './SchemaField';
import type { FieldRefManager } from '../store/focusRegistry';

type AutoFormProps = {
  keys: DataKey[];
  refManager: FieldRefManager;
  className?: string;
};

/**
 * 자동 폼 생성 컴포넌트
 * DataKey 배열을 받아 SchemaField들을 렌더링
 */
export function AutoForm({ keys, refManager, className = '' }: AutoFormProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {keys.map((key) => (
        <SchemaField key={key} fieldKey={key} refManager={refManager} />
      ))}
    </div>
  );
}

type FormSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * 폼 섹션 컴포넌트
 * 관련 필드들을 그룹화하여 표시
 */
export function FormSection({ title, children, className = '' }: FormSectionProps) {
  return (
    <section className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}
