import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex size-full min-h-screen items-center bg-gray-900">
      <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl font-extrabold tracking-tight text-white lg:text-9xl">
            404
          </h1>
          <p className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl dark:text-white">
            Alguma coisa aconteceu.
          </p>
          <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
            Desculpe, mas nao podemos encontrar essa página.{' '}
          </p>
          <Link href="/">
            <button className="hover:bg-primary-800 focus:ring-primary-300 dark:focus:ring-primary-900 my-4 inline-flex rounded-lg bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-900 focus:outline-none focus:ring-4">
              Volte para o inicio
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
