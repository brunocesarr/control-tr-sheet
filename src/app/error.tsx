'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center">
      <h1 id="error-title" className="text-2xl font-semibold text-white">
        Algo deu errado
      </h1>
      <p id="error-description" className="max-w-md text-sm text-slate-300">
        Não foi possível carregar esta página. Tente novamente — se o problema persistir, contate o
        administrador do sistema.
      </p>
      {error.digest && <code className="text-xs text-slate-500">ref: {error.digest}</code>}
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500">
        Tentar novamente
      </button>
    </div>
  );
}
