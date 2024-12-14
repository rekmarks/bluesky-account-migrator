import { AtpAgent } from '@atproto/api';
import type { MigrationCredentials, AgentPair } from '../types.js';
import { makeAuthenticatedAgent } from '../utils.js';

/**
 * Initialize the agents and login to the old account on the old PDS.
 *
 * @param options - Options bag.
 * @param options.credentials - The credentials.
 */
export async function initializeAgents({
  credentials,
}: {
  credentials: MigrationCredentials;
}): Promise<AgentPair> {
  const oldAgent = await makeAuthenticatedAgent({
    pdsUrl: credentials.oldPdsUrl,
    handle: credentials.oldHandle,
    password: credentials.oldPassword,
  });

  const accountDid = oldAgent.session?.did;
  if (!accountDid) {
    throw new Error('Failed to get DID for old account');
  }

  const newAgent = new AtpAgent({ service: credentials.newPdsUrl });

  return { oldAgent, newAgent, accountDid };
}
