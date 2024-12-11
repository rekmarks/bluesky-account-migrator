import { AtpAgent } from '@atproto/api';
import type { MigrationCredentials, AgentPair } from '../types.js';

export async function initializeAgents(
  credentials: MigrationCredentials,
): Promise<AgentPair> {
  const fromAgent = new AtpAgent({ service: credentials.fromPdsUrl });
  const toAgent = new AtpAgent({ service: credentials.toPdsUrl });

  await fromAgent.login({
    identifier: credentials.fromHandle,
    password: credentials.fromPassword,
  });

  const accountDid = fromAgent.session?.did;
  if (!accountDid) {
    throw new Error('Could not get DID for old account');
  }

  return { fromAgent, toAgent, accountDid };
}
