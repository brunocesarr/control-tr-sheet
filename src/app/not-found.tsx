import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex items-center bg-gray-900 w-full h-full min-h-screen">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-white">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
            Alguma coisa aconteceu.
          </p>
          <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
            Desculpe, mas nao podemos encontrar essa página. {' '}
          </p>
          <Link
            href="/"
            >
              <button className="inline-flex text-gray-900 bg-white hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4">
              Volte para o inicio
              </button>
          </Link>
        </div>
      </div>
    </section>
  );
}