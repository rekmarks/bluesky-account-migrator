import type { MigrationCredentials, AgentPair } from '../types.js';

export async function createNewAccount(
  { fromAgent, toAgent, accountDid }: AgentPair,
  credentials: MigrationCredentials,
): Promise<void> {
  const describeRes = await toAgent.com.atproto.server.describeServer();
  const newServerDid = describeRes.data.did;

  const serviceJwtRes = await fromAgent.com.atproto.server.getServiceAuth({
    aud: newServerDid,
    lxm: 'com.atproto.server.createAccount',
  });
  const serviceJwt = serviceJwtRes.data.token;

  await toAgent.com.atproto.server.createAccount(
    {
      handle: credentials.toHandle,
      email: credentials.toEmail,
      password: credentials.toPassword,
      did: accountDid,
      inviteCode: credentials.inviteCode,
    },
    {
      headers: { authorization: `Bearer ${serviceJwt}` },
      encoding: 'application/json',
    },
  );

  await toAgent.login({
    identifier: credentials.toHandle,
    password: credentials.toPassword,
  });
}
