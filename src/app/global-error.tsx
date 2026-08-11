'use client';

/** Same shell-via-constants approach as the root layout. */
const Html = 'html' as const;
const Body = 'body' as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Html lang="pt-br">
      <Body className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
        <div className="text-center">
          <h1 id="global-error-title" className="text-2xl font-semibold text-white">
            Erro inesperado
          </h1>
          <p id="global-error-description" className="mt-2 text-sm text-slate-300">
            A aplicação encontrou um problema crítico.
          </p>
          {error.digest && (
            <code className="mt-2 block text-xs text-slate-500">{error.digest}</code>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-md bg-emerald-600 px-5 py-2 text-sm text-white hover:bg-emerald-500">
            Recarregar
          </button>
        </div>
      </Body>
    </Html>
  );
}
