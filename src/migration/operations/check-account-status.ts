import assert from 'assert';

import { AccountStatusSchema } from '../types.js';
import type { AccountStatuses, AgentPair } from '../types.js';

export async function checkAccountStatus({
  agents: { oldAgent, newAgent },
}: {
  agents: AgentPair;
}): Promise<{
  accountStatuses: AccountStatuses;
}> {
  const { data: oldAccountStatus } =
    await oldAgent.com.atproto.server.checkAccountStatus();
  const { data: newAccountStatus } =
    await newAgent.com.atproto.server.checkAccountStatus();

  // TODO: remove
  console.log('ACCOUNT STATUSES');
  console.log(oldAccountStatus);
  console.log(newAccountStatus);

  assert(!newAccountStatus.activated, 'New account is already activated');
  assert(newAccountStatus.validDid, 'New account has an invalid DID');

  return {
    accountStatuses: {
      old: AccountStatusSchema.parse(oldAccountStatus),
      new: AccountStatusSchema.parse(newAccountStatus),
    },
  };
}
