import { useState } from 'react';
import { FormPage } from './pages/FormPage';
import { FormPageRHF } from './pages/FormPageRHF';

type FormMode = 'zustand' | 'rhf';

export function App() {
  const [mode, setMode] = useState<FormMode>('zustand');

  return (
    <div>
      <nav className="bg-slate-900 text-white border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-300">상태관리 방식 비교</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('zustand')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === 'zustand'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Zustand 버전
            </button>
            <button
              type="button"
              onClick={() => setMode('rhf')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === 'rhf'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              RHF 버전
            </button>
          </div>
        </div>
      </nav>

      {mode === 'zustand' ? <FormPage /> : <FormPageRHF />}
    </div>
  );
}
