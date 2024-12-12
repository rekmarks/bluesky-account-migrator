import { Secp256k1Keypair } from '@atproto/crypto';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import type { AgentPair, PlcOperationParams } from '../types.js';

export async function migrateIdentity(
  { oldAgent, newAgent }: AgentPair,
  token: string,
): Promise<string> {
  const recoveryKey = await Secp256k1Keypair.create({ exportable: true });
  const privateKeyBytes = await recoveryKey.export();
  const privateKey = uint8ArrayToString(privateKeyBytes, 'hex');

  await oldAgent.com.atproto.identity.requestPlcOperationSignature();

  const getDidCredentials =
    await newAgent.com.atproto.identity.getRecommendedDidCredentials();
  const rotationKeys = getDidCredentials.data.rotationKeys ?? [];
  if (!getDidCredentials.data.rotationKeys) {
    throw new Error('New PDS did not provide any rotation keys');
  }

  const plcCredentials: PlcOperationParams = {
    ...getDidCredentials.data,
    rotationKeys: [recoveryKey.did(), ...rotationKeys],
    token,
  };

  const plcOp =
    await oldAgent.com.atproto.identity.signPlcOperation(plcCredentials);

  await newAgent.com.atproto.identity.submitPlcOperation({
    operation: plcOp.data.operation,
  });

  return privateKey;
}
