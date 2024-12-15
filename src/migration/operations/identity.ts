import { Secp256k1Keypair } from '@atproto/crypto';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

import type { AgentPair, PlcOperationParams } from '../types.js';

/**
 * Migrate the identity from the old PDS to the new PDS.
 *
 * **NOTE:** The returned private key must be stored by the user.
 *
 * @param options - Options bag.
 * @param options.agents - The agent pair.
 * @param options.confirmationToken - The confirmation token to use for the operation.
 * @returns The private key of the recovery key for the new account.
 */
export async function migrateIdentity({
  agents: { oldAgent, newAgent },
  confirmationToken,
}: {
  agents: AgentPair;
  confirmationToken: string;
}): Promise<string> {
  const { recoveryKey, privateKey } = await generateRecoveryKey();

  const getDidCredentials =
    await newAgent.com.atproto.identity.getRecommendedDidCredentials();
  const rotationKeys = getDidCredentials.data.rotationKeys ?? [];
  if (!getDidCredentials.data.rotationKeys) {
    throw new Error('New PDS did not provide any rotation keys');
  }

  const plcCredentials: PlcOperationParams = {
    ...getDidCredentials.data,
    rotationKeys: [recoveryKey.did(), ...rotationKeys],
    token: confirmationToken,
  };

  const plcOp =
    await oldAgent.com.atproto.identity.signPlcOperation(plcCredentials);

  await newAgent.com.atproto.identity.submitPlcOperation({
    operation: plcOp.data.operation,
  });

  return privateKey;
}

async function generateRecoveryKey() {
  const recoveryKey = await Secp256k1Keypair.create({ exportable: true });
  const privateKeyBytes = await recoveryKey.export();
  const privateKey = uint8ArrayToString(privateKeyBytes, 'hex');
  return { recoveryKey, privateKey };
}
