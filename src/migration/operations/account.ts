import {
  type MigrationCredentials,
  type AgentPair,
  getMigrationHandle,
} from '../types.js';

/**
 * Create a new account on the new PDS and login to it.
 *
 * @param options - Options bag.
 * @param options.agents - The agent pair.
 * @param options.credentials - The credentials.
 */
export async function createNewAccount({
  agents,
  credentials,
}: {
  agents: AgentPair;
  credentials: MigrationCredentials;
}): Promise<void> {
  const describeRes = await agents.newAgent.com.atproto.server.describeServer();
  const newServerDid = describeRes.data.did;

  const serviceJwtRes = await agents.oldAgent.com.atproto.server.getServiceAuth(
    {
      aud: newServerDid,
      lxm: 'com.atproto.server.createAccount',
    },
  );
  const serviceJwt = serviceJwtRes.data.token;

  await agents.newAgent.com.atproto.server.createAccount(
    {
      handle: getMigrationHandle(credentials),
      email: credentials.newEmail,
      password: credentials.newPassword,
      did: agents.accountDid,
      inviteCode: credentials.inviteCode,
    },
    {
      headers: { authorization: `Bearer ${serviceJwt}` },
      encoding: 'application/json',
    },
  );

  await agents.newAgent.login({
    identifier: getMigrationHandle(credentials),
    password: credentials.newPassword,
  });
}
