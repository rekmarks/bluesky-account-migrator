import { AtpAgent } from '@atproto/api';
import type { MigrationCredentials, AgentPair } from '../types.js';

export async function initializeAgents(
  credentials: MigrationCredentials,
): Promise<AgentPair> {
  const oldAgent = new AtpAgent({ service: credentials.oldPdsUrl });
  const newAgent = new AtpAgent({ service: credentials.newPdsUrl });

  await oldAgent.login({
    identifier: credentials.oldHandle,
    password: credentials.oldPassword,
  });

  const accountDid = oldAgent.session?.did;
  if (!accountDid) {
    throw new Error('Could not get DID for old account');
  }

  return { oldAgent, newAgent, accountDid };
}
