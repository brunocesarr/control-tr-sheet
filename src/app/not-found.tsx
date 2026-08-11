import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center">
      <p id="not-found-code" className="text-sm font-medium text-emerald-400">
        404
      </p>
      <h1 id="not-found-title" className="text-2xl font-semibold text-white">
        Página não encontrada
      </h1>
      <p id="not-found-description" className="max-w-sm text-sm text-slate-300">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        href="/home"
        className="mt-3 rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500">
        Voltar ao início
      </Link>
    </div>
  );
}
