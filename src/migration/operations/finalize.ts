import type { AgentPair, MigrationCredentials } from '../types.js';
import { makeAuthenticatedAgent } from '../utils.js';

/**
 * Finalize the migration by activating the new account on the new PDS and
 * deactivating the old account on the old PDS.
 *
 * @param options - Options bag.
 * @param options.agents - The agent pair.
 * @param options.credentials - The migration credentials.
 */
export async function finalize({
  agents: { newAgent },
  credentials,
}: {
  agents: AgentPair;
  credentials: MigrationCredentials;
}): Promise<void> {
  await newAgent.com.atproto.server.activateAccount();

  // Due to what is likely a bug in Bluesky's API, we need to re-authenticate
  // to the old PDS to deactivate the account.
  const oldAgent = await makeAuthenticatedAgent({
    pdsUrl: credentials.oldPdsUrl,
    handle: credentials.oldHandle,
    password: credentials.oldPassword,
  });
  // ATTN: The call will fail without the `{}`
  await oldAgent.com.atproto.server.deactivateAccount({});
}
