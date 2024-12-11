import type { AgentPair } from '../types.js';

export async function finalizeMigration({
  oldAgent,
  newAgent,
}: AgentPair): Promise<void> {
  await newAgent.com.atproto.server.activateAccount();
  await oldAgent.com.atproto.server.deactivateAccount();
}
