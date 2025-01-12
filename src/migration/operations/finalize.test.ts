import { describe, it, expect, vi } from 'vitest';

import { finalize } from './finalize.js';
import type { MigrationCredentialsWithFinalHandle } from '../../../test/utils.js';
import {
  assertHasFinalHandle,
  makeMockAgent,
  makeMockCredentials,
  makeMockCredentialsWithFinalHandle,
  mockAccountDid,
} from '../../../test/utils.js';
import { makeAuthenticatedAgent } from '../utils.js';

vi.mock('../utils.js', () => ({
  makeAuthenticatedAgent: vi.fn(),
}));

describe('finalize', () => {
  it('should activate new account and deactivate old account', async () => {
    const actualOldAgent = makeMockAgent();
    const newAgent = makeMockAgent();
    const mockCredentials = makeMockCredentials();

    vi.mocked(makeAuthenticatedAgent).mockResolvedValue(actualOldAgent);

    await finalize({
      agents: {
        oldAgent: makeMockAgent(),
        newAgent,
        accountDid: mockAccountDid,
      },
      credentials: mockCredentials,
    });

    expect(newAgent.com.atproto.server.activateAccount).toHaveBeenCalled();
    expect(
      actualOldAgent.com.atproto.server.deactivateAccount,
    ).toHaveBeenCalled();
    expect(newAgent.com.atproto.identity.updateHandle).not.toHaveBeenCalled();
  });

  it('should update handle if finalHandle is provided', async () => {
    const newAgent = makeMockAgent();
    const mockCredentials: MigrationCredentialsWithFinalHandle =
      makeMockCredentialsWithFinalHandle('new.bar.com');
    vi.mocked(makeAuthenticatedAgent).mockResolvedValue(makeMockAgent());

    await finalize({
      agents: {
        oldAgent: makeMockAgent(),
        newAgent,
        accountDid: mockAccountDid,
      },
      credentials: mockCredentials,
    });

    assertHasFinalHandle(mockCredentials);

    expect(newAgent.com.atproto.identity.updateHandle).toHaveBeenCalled();
    expect(newAgent.com.atproto.identity.updateHandle).toHaveBeenCalledWith({
      handle: mockCredentials.newHandle.finalHandle,
    });
  });

  it('should throw an error if updating handle fails', async () => {
    const newAgent = makeMockAgent();
    vi.mocked(newAgent.com.atproto.identity.updateHandle).mockRejectedValue(
      new Error('foo'),
    );
    const mockCredentials = makeMockCredentialsWithFinalHandle('new.bar.com');
    vi.mocked(makeAuthenticatedAgent).mockResolvedValue(makeMockAgent());

    const { temporaryHandle, finalHandle } = mockCredentials.newHandle;
    await expect(
      finalize({
        agents: {
          oldAgent: makeMockAgent(),
          newAgent,
          accountDid: mockAccountDid,
        },
        credentials: mockCredentials,
      }),
    ).rejects.toThrow(
      `Account successfully migrated, but failed to update handle to "${finalHandle}". The current handle is "${temporaryHandle}".`,
    );
  });
});
