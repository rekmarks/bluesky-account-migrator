import { describe, it, expect, vi, Mocked } from 'vitest';
import { createNewAccount } from './account.js';
import {
  makeMockAgent,
  makeMockCredentials,
  mockAccountDid,
} from '../../../test/utils.js';

describe('createNewAccount', () => {
  it('should create and authenticate new account', async () => {
    const mockCredentials = makeMockCredentials();
    const fromAgent = makeMockAgent(mockAccountDid);
    const toAgent = makeMockAgent();
    const newServerDid = 'did:plc:newserver123';

    vi.mocked(toAgent.com.atproto.server.describeServer).mockResolvedValue({
      // @ts-expect-error
      data: { did: newServerDid },
    });

    // @ts-expect-error
    vi.mocked(fromAgent.com.atproto.server.getServiceAuth).mockResolvedValue({
      data: { token: 'jwt-token-123' },
    });

    await createNewAccount(
      { fromAgent: fromAgent, toAgent: toAgent, accountDid: mockAccountDid },
      mockCredentials,
    );

    expect(fromAgent.com.atproto.server.getServiceAuth).toHaveBeenCalledWith({
      aud: newServerDid,
      lxm: 'com.atproto.server.createAccount',
    });

    expect(toAgent.com.atproto.server.createAccount).toHaveBeenCalledWith(
      {
        handle: mockCredentials.toHandle,
        email: mockCredentials.toEmail,
        password: mockCredentials.toPassword,
        did: mockAccountDid,
        inviteCode: mockCredentials.inviteCode,
      },
      {
        headers: { authorization: 'Bearer jwt-token-123' },
        encoding: 'application/json',
      },
    );

    expect(toAgent.login).toHaveBeenCalledWith({
      identifier: mockCredentials.toHandle,
      password: mockCredentials.toPassword,
    });
  });
});
