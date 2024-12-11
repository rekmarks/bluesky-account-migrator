import type { AgentPair } from '../types.js';

export async function finalizeMigration({
  fromAgent,
  toAgent,
}: AgentPair): Promise<void> {
  await toAgent.com.atproto.server.activateAccount();
  await fromAgent.com.atproto.server.deactivateAccount();
}
