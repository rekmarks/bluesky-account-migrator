import { describe, it, expect, vi, Mocked } from 'vitest';
import { AtpAgent } from '@atproto/api';
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
    const fromAgent = makeMockAgent(mockAccountDid);
    const toAgent = makeMockAgent();

    vi.mocked(AtpAgent)
      .mockImplementationOnce(() => fromAgent)
      .mockImplementationOnce(() => toAgent);

    const result = await initializeAgents(mockCredentials);

    expect(fromAgent.login).toHaveBeenCalledWith({
      identifier: mockCredentials.fromHandle,
      password: mockCredentials.fromPassword,
    });
    expect(result.accountDid).toBe(mockAccountDid);
    expect(result.fromAgent).toBe(fromAgent);
    expect(result.toAgent).toBe(toAgent);
  });

  it('should throw error if DID is not available after login', async () => {
    const mockCredentials = makeMockCredentials();
    const fromAgent = makeMockAgent(); // no DID provided
    const toAgent = makeMockAgent();

    vi.mocked(AtpAgent)
      .mockImplementationOnce(() => fromAgent)
      .mockImplementationOnce(() => toAgent);

    await expect(initializeAgents(mockCredentials)).rejects.toThrow(
      'Could not get DID for old account',
    );
  });
});
