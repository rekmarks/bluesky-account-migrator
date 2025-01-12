import { describe, it, expect, vi } from 'vitest';

import { createNewAccount } from './account.js';
import {
  makeMockAgent,
  makeMockCredentials,
  makeXrpcResponse,
  mockAccountDid,
} from '../../../test/utils.js';

describe('createNewAccount', () => {
  it('should create and authenticate new account', async () => {
    const mockCredentials = makeMockCredentials();
    const oldAgent = makeMockAgent(mockAccountDid);
    const newAgent = makeMockAgent();
    const newServerDid = 'did:plc:newserver123';

    vi.mocked(newAgent.com.atproto.server.describeServer).mockResolvedValue(
      makeXrpcResponse({ did: newServerDid, availableUserDomains: [] }),
    );

    vi.mocked(oldAgent.com.atproto.server.getServiceAuth).mockResolvedValue(
      makeXrpcResponse({ token: 'jwt-token-123' }),
    );

    await createNewAccount({
      agents: { oldAgent, newAgent, accountDid: mockAccountDid },
      credentials: mockCredentials,
    });

    expect(oldAgent.com.atproto.server.getServiceAuth).toHaveBeenCalledWith({
      aud: newServerDid,
      lxm: 'com.atproto.server.createAccount',
    });

    expect(newAgent.com.atproto.server.createAccount).toHaveBeenCalledWith(
      {
        handle: mockCredentials.newHandle.handle,
        email: mockCredentials.newEmail,
        password: mockCredentials.newPassword,
        did: mockAccountDid,
        inviteCode: mockCredentials.inviteCode,
      },
      {
        headers: { authorization: 'Bearer jwt-token-123' },
        encoding: 'application/json',
      },
    );

    expect(newAgent.login).toHaveBeenCalledWith({
      identifier: mockCredentials.newHandle.handle,
      password: mockCredentials.newPassword,
    });
  });
});
