/**
 * Runs once when the Next.js server boots (Node runtime only).
 * Fails the deploy immediately if required secrets are absent.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { assertServerEnv } = await import('@/configs/env.server');
  try {
    assertServerEnv();
    console.info('[env] ✅ All required server environment variables are present.');
  } catch (error) {
    console.error('[env] ❌ Startup aborted.', error);
    throw error;
  }
}
