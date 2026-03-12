import { useEffect, useMemo } from 'react';
import type { DataKey } from '../types/form';
import { useFormStore, useFormActions, useLastFocusRequest } from '../store';
import { AutoForm, FormSection } from '../components/AutoForm';
import { createFieldRefManager } from '../store/focusRegistry';

// 섹션별 필드 키 정의
const baseInfoKeys: DataKey[] = ['base.name', 'base.displayName', 'base.code'];
const priceInfoKeys: DataKey[] = ['price.salePrice', 'price.fee', 'price.marginRate'];
const deliveryInfoKeys: DataKey[] = ['delivery.type', 'delivery.cost', 'delivery.freeThreshold'];
const optionKeys: DataKey[] = ['options.isActive', 'options.memo'];
  
/**
 * 폼 페이지 컴포넌트
 *
 * DataKey 배열로 어떤 필드를 어떤 순서로 보여줄지 결정
 */
export function FormPage() {
  const actions = useFormActions();
  const hasChanges = useFormStore((s) => s.data.hasChanges);
  const focusRequest = useLastFocusRequest();
  const fieldRefManager = useMemo(() => createFieldRefManager(), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = useFormStore.getState().data.formData;
    console.log('Submit form data:', formData);
    alert('폼 데이터가 콘솔에 출력되었습니다.');
  };

  const handleReset = () => {
    if (window.confirm('폼을 초기화하시겠습니까?')) {
      actions.resetForm();
    }
  };

  useEffect(() => {
    if (!focusRequest) return;
    fieldRefManager.focus(focusRequest.key);
  }, [fieldRefManager, focusRequest]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">상품 등록</h1>
              <p className="text-sm text-gray-500 mt-1">
                Zustand + Schema 기반 복잡한 폼 관리 예제
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                  변경사항 있음
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본정보 섹션 */}
          <FormSection title="📦 기본정보">
            <AutoForm keys={baseInfoKeys} refManager={fieldRefManager} />
          </FormSection>

          {/* 가격정보 섹션 */}
          <FormSection title="💰 가격정보">
            <AutoForm keys={priceInfoKeys} refManager={fieldRefManager} />
          </FormSection>

          {/* 배송정보 섹션 */}
          <FormSection title="🚚 배송정보">
            <AutoForm keys={deliveryInfoKeys} refManager={fieldRefManager} />
          </FormSection>

          {/* 기타설정 섹션 */}
          <FormSection title="⚙️ 기타설정">
            <AutoForm keys={optionKeys} refManager={fieldRefManager} />
          </FormSection>

          {/* 버튼 영역 */}
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
              className="px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              저장하기
            </button>
          </div>
        </form>

        {/* 디버그 패널 */}
        <DebugPanel />
      </main>
    </div>
  );
}

/**
 * 디버그 패널 - 현재 폼 상태 실시간 표시
 */
function DebugPanel() {
  const formData = useFormStore((s) => s.data.formData);
  const fieldUI = useFormStore((s) => s.ui.fieldUI);

  return (
    <section className="mt-8 bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100">🔍 디버그 패널</h3>
        <p className="text-xs text-gray-400 mt-1">실시간 상태 확인</p>
      </div>
      <div className="p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Form Data</h4>
          <pre className="text-xs text-green-400 bg-gray-950 p-4 rounded-lg overflow-auto max-h-80">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Runtime Field UI</h4>
          <pre className="text-xs text-yellow-400 bg-gray-950 p-4 rounded-lg overflow-auto max-h-80">
            {JSON.stringify(fieldUI, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
