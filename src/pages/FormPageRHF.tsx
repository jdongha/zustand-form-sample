import { FormProvider } from 'react-hook-form';
import { FormSection } from '@/components/AutoForm';
import { ControlledField } from '@/rhf/components/ControlledField';
import { productFieldCatalog, productFormSections } from '@/rhf/fieldCatalog';
import { productDefaultValues } from '@/rhf/schemas';
import type { FieldOverrides, FieldRuleHandlers, ProductFieldName } from '@/rhf/types';
import { useProductForm } from '@/rhf/useProductForm';
import { useProductFormBehaviors } from '@/rhf/useProductFormBehaviors';

type SectionRendererProps = {
  title: string;
  fields: ProductFieldName[];
  fieldRules: Partial<Record<ProductFieldName, FieldRuleHandlers>>;
  fieldOverrides: FieldOverrides;
};

function SectionRenderer({
  title,
  fields,
  fieldRules,
  fieldOverrides,
}: SectionRendererProps) {
  return (
    <FormSection title={title}>
      <div className="space-y-4">
        {fields.map((fieldName) => (
          <ControlledField
            key={fieldName}
            meta={productFieldCatalog[fieldName]}
            rules={fieldRules[fieldName]}
            overrides={fieldOverrides[fieldName]}
          />
        ))}
      </div>
    </FormSection>
  );
}

export function FormPageRHF() {
  const form = useProductForm(productDefaultValues);
  const { fieldRules, fieldOverrides, uiState } = useProductFormBehaviors(form);
  const formData = form.watch();

  const handleSubmit = form.handleSubmit((values) => {
    console.log('Submit form data (RHF):', values);
    alert('RHF 폼 데이터가 콘솔에 출력되었습니다.');
  });

  const handleReset = () => {
    if (!window.confirm('폼을 초기화하시겠습니까?')) return;
    form.reset(structuredClone(productDefaultValues));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">상품 등록</h1>
              <p className="text-sm text-gray-500 mt-1">
                React Hook Form + Zod 기반 복잡한 폼 관리 예제
              </p>
            </div>
            <div className="flex items-center gap-3">
              {form.formState.isDirty && (
                <span className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                  변경사항 있음
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {productFormSections.map((section) => (
              <SectionRenderer
                key={section.id}
                title={section.title}
                fields={section.fields}
                fieldRules={fieldRules}
                fieldOverrides={fieldOverrides}
              />
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                초기화
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
              >
                저장하기
              </button>
            </div>
          </form>
        </FormProvider>

        <DebugPanel formData={formData} uiState={uiState} />
      </main>
    </div>
  );
}

type DebugPanelProps = {
  formData: unknown;
  uiState: unknown;
};

function DebugPanel({ formData, uiState }: DebugPanelProps) {
  return (
    <section className="mt-8 bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100">🔍 디버그 패널</h3>
        <p className="text-xs text-gray-400 mt-1">실시간 상태 확인 (RHF)</p>
      </div>
      <div className="p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Form Data</h4>
          <pre className="text-xs text-green-400 bg-gray-950 p-4 rounded-lg overflow-auto max-h-80">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Derived UI State</h4>
          <pre className="text-xs text-yellow-400 bg-gray-950 p-4 rounded-lg overflow-auto max-h-80">
            {JSON.stringify(uiState, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
