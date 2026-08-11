import { Account, Client, ID } from 'appwrite';

import { clientEnv } from '@/configs/env.client';

/** Browser-side singleton — carries the Appwrite session cookie. */
export const client = new Client()
  .setEndpoint(clientEnv.appwriteEndpoint)
  .setProject(clientEnv.appwriteProjectId);

export const account = new Account(client);

/**
 * Per-request client for route handlers. Scoped to a single user's JWT so
 * that `account.get()` both authenticates AND authorises in one call.
 * Never reuse across requests — that would leak identities between users.
 */
export function createScopedClient(jwt: string): Account {
  const scoped = new Client()
    .setEndpoint(clientEnv.appwriteEndpoint)
    .setProject(clientEnv.appwriteProjectId)
    .setJWT(jwt);

  return new Account(scoped);
}

export { ID };
