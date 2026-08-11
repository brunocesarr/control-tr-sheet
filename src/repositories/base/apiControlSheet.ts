import axios, { type AxiosInstance } from 'axios';

import { clientEnv } from '@/configs/env.client';

/** Dispatched on a 401 so a React component can route via the App Router. */
export const SESSION_EXPIRED_EVENT = 'control-tr-sheet:session-expired';

/**
 * On the client a relative baseURL is correct (same origin, cookies attached).
 * On the server an absolute URL is mandatory, so fall back to the env var and
 * then to Vercel's injected host.
 */
function resolveBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  if (clientEnv.baseUrl) return clientEnv.baseUrl;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export const apiManagerSheet: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 30_000,
  withCredentials: true, // send the httpOnly session cookie
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

/** Normalises Axios errors into plain Errors carrying the server's message. */
apiManagerSheet.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ?? error?.message ?? 'Erro inesperado na requisição.';

    /**
     * Previously this called `window.location.assign(...)`, which forces a full
     * document reload and discards the React tree — flagged by Next 16's
     * @next/next/no-location-assign-relative-destination.
     *
     * Navigation is a UI concern, so the interceptor only announces the
     * expiry. SessionExpiryListener performs a client-side router.replace.
     */
    if (status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(Object.assign(new Error(message), { status }));
  }
);
