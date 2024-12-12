import type { AgentPair } from '../types.js';

/**
 * Finalize the migration by activating the new account on the new PDS and
 * deactivating the old account on the old PDS.
 *
 * @param options - Options bag.
 * @param options.agents - The agent pair.
 */
export async function finalizeMigration({
  oldAgent,
  newAgent,
}: AgentPair): Promise<void> {
  await newAgent.com.atproto.server.activateAccount();
  // ATTN: The call will fail without the `{}`
  await oldAgent.com.atproto.server.deactivateAccount({});
}
