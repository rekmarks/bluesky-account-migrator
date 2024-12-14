import { AtpAgent } from '@atproto/api';

type AuthenticateAgentOptions = {
  pdsUrl: string;
  handle: string;
  password: string;
};

/**
 * Get an authenticated agent for the given PDS URL, handle, and password.
 *
 * @param options - Options bag.
 * @param options.pdsUrl - The PDS URL.
 * @param options.handle - The handle.
 * @param options.password - The password.
 * @returns The authenticated agent.
 */
export const makeAuthenticatedAgent = async ({
  pdsUrl,
  handle,
  password,
}: AuthenticateAgentOptions): Promise<AtpAgent> => {
  const agent = new AtpAgent({ service: pdsUrl });
  await agent.login({
    identifier: handle,
    password,
  });
  return agent;
};
