import { describe, it, expect, vi } from 'vitest';
import { makeAuthenticatedAgent } from '../utils.js';
import { finalize } from './finalize.js';
import {
  makeMockAgent,
  makeMockCredentials,
  mockAccountDid,
} from '../../../test/utils.js';

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
  });
});
