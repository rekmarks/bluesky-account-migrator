import { AtpAgent } from '@atproto/api';
import { describe, it, expect, vi } from 'vitest';

import { initializeAgents } from './initialize.js';
import {
  makeMockAgent,
  makeMockCredentials,
  mockAccountDid,
} from '../../../test/utils.js';

vi.mock('@atproto/api', () => ({
  AtpAgent: vi.fn(),
}));

describe('initializeAgents', () => {
  it('should initialize and authenticate agents successfully', async () => {
    const mockCredentials = makeMockCredentials();
    const oldAgent = makeMockAgent(mockAccountDid);
    const newAgent = makeMockAgent();

    vi.mocked(AtpAgent)
      .mockImplementationOnce(() => oldAgent)
      .mockImplementationOnce(() => newAgent);

    const result = await initializeAgents({ credentials: mockCredentials });

    expect(oldAgent.login).toHaveBeenCalledWith({
      identifier: mockCredentials.oldHandle,
      password: mockCredentials.oldPassword,
    });
    expect(result.accountDid).toBe(mockAccountDid);
    expect(result.oldAgent).toBe(oldAgent);
    expect(result.newAgent).toBe(newAgent);
  });

  it('should throw error if DID is not available after login', async () => {
    const mockCredentials = makeMockCredentials();
    const oldAgent = makeMockAgent(); // no DID provided
    const newAgent = makeMockAgent();

    vi.mocked(AtpAgent)
      .mockImplementationOnce(() => oldAgent)
      .mockImplementationOnce(() => newAgent);

    await expect(
      initializeAgents({ credentials: mockCredentials }),
    ).rejects.toThrow('Failed to get DID for old account');
  });
});
