/**
 * Public environment access, safe for the browser bundle.
 * Next.js inlines NEXT_PUBLIC_* at build time, so these must be
 * referenced statically (no dynamic process.env[key] lookups).
 */

function requiredPublic(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`[env] Missing required public environment variable: ${name}`);
  }
  return value.trim();
}

export const clientEnv = {
  appwriteEndpoint:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim() || 'https://cloud.appwrite.io/v1',

  get appwriteProjectId(): string {
    return requiredPublic(
      process.env.NEXT_PUBLIC_APP_WRITE_PROJECT_ID,
      'NEXT_PUBLIC_APP_WRITE_PROJECT_ID'
    );
  },

  baseUrl: process.env.NEXT_PUBLIC_URL_AMBIENTE_SERVER?.trim() || '',

  environmentSuffix: process.env.NEXT_PUBLIC_AMBIENTE_TR_MANAGER_WEB_APP?.trim() || '',

  storageObfuscationKey:
    process.env.NEXT_PUBLIC_STORAGE_OBFUSCATION_KEY?.trim() || 'control-tr-sheet',
} as const;
