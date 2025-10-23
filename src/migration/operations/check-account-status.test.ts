import { describe, it, expect, vi } from 'vitest';

import { checkAccountStatus } from './check-account-status.js';
import {
  makeMockAccountStatus,
  makeMockAgent,
  makeXrpcResponse,
  mockAccountDid,
} from '../../../test/utils.js';

describe('checkAccountStatus', () => {
  it('should check account status for both agents and return statuses', async () => {
    const oldAgent = makeMockAgent(mockAccountDid);
    const newAgent = makeMockAgent();

    const oldAccountStatus = makeMockAccountStatus();

    const newAccountStatus = makeMockAccountStatus({
      activated: false,
    });

    vi.mocked(oldAgent.com.atproto.server.checkAccountStatus).mockResolvedValue(
      makeXrpcResponse(oldAccountStatus),
    );

    vi.mocked(newAgent.com.atproto.server.checkAccountStatus).mockResolvedValue(
      makeXrpcResponse(newAccountStatus),
    );

    const result = await checkAccountStatus({
      agents: { oldAgent, newAgent, accountDid: mockAccountDid },
    });

    expect(
      oldAgent.com.atproto.server.checkAccountStatus,
    ).toHaveBeenCalledWith();
    expect(
      newAgent.com.atproto.server.checkAccountStatus,
    ).toHaveBeenCalledWith();

    expect(result).toStrictEqual({
      accountStatuses: {
        old: oldAccountStatus,
        new: newAccountStatus,
      },
    });
  });

  it('should throw error when new account is already activated', async () => {
    const oldAgent = makeMockAgent(mockAccountDid);
    const newAgent = makeMockAgent();

    const oldAccountStatus = makeMockAccountStatus();

    const newAccountStatus = makeMockAccountStatus({
      activated: true, // This should cause an error
    });

    vi.mocked(oldAgent.com.atproto.server.checkAccountStatus).mockResolvedValue(
      makeXrpcResponse(oldAccountStatus),
    );

    vi.mocked(newAgent.com.atproto.server.checkAccountStatus).mockResolvedValue(
      makeXrpcResponse(newAccountStatus),
    );

    await expect(
      checkAccountStatus({
        agents: { oldAgent, newAgent, accountDid: mockAccountDid },
      }),
    ).rejects.toThrow('New account is already activated');
  });

  it('should throw error when new account has invalid DID', async () => {
    const oldAgent = makeMockAgent(mockAccountDid);
    const newAgent = makeMockAgent();

    const oldAccountStatus = makeMockAccountStatus();

    const newAccountStatus = makeMockAccountStatus({
      activated: false,
      validDid: false, // This should cause an error
    });

    vi.mocked(oldAgent.com.atproto.server.checkAccountStatus).mockResolvedValue(
      makeXrpcResponse(oldAccountStatus),
    );

    vi.mocked(newAgent.com.atproto.server.checkAccountStatus).mockResolvedValue(
      makeXrpcResponse(newAccountStatus),
    );

    await expect(
      checkAccountStatus({
        agents: { oldAgent, newAgent, accountDid: mockAccountDid },
      }),
    ).rejects.toThrow('New account has an invalid DID');
  });

  it('should throw error when both new account is activated and has invalid DID', async () => {
    const oldAgent = makeMockAgent(mockAccountDid);
    const newAgent = makeMockAgent();

    const oldAccountStatus = makeMockAccountStatus();

    const newAccountStatus = makeMockAccountStatus({
      activated: true,
      validDid: false,
    });

    vi.mocked(oldAgent.com.atproto.server.checkAccountStatus).mockResolvedValue(
      makeXrpcResponse(oldAccountStatus),
    );

    vi.mocked(newAgent.com.atproto.server.checkAccountStatus).mockResolvedValue(
      makeXrpcResponse(newAccountStatus),
    );

    await expect(
      checkAccountStatus({
        agents: { oldAgent, newAgent, accountDid: mockAccountDid },
      }),
    ).rejects.toThrow('New account is already activated');
  });
});
