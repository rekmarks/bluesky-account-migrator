import type { AgentPair } from '../types.js';

/**
 * Request a PLC operation signature from the old PDS.
 *
 * @param options - Options bag.
 * @param options.agents - The agent pair.
 */
export async function requestPlcOperation({
  oldAgent,
}: AgentPair): Promise<void> {
  await oldAgent.com.atproto.identity.requestPlcOperationSignature();
}