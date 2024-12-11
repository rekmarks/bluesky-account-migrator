import { describe, it, expect } from 'vitest';
import { finalizeMigration } from './finalize.js';
import { makeMockAgent, mockAccountDid } from '../../../test/utils.js';

describe('finalizeMigration', () => {
  it('should activate new account and deactivate old account', async () => {
    const fromAgent = makeMockAgent();
    const toAgent = makeMockAgent();

    await finalizeMigration({
      fromAgent: fromAgent,
      toAgent: toAgent,
      accountDid: mockAccountDid,
    });

    expect(toAgent.com.atproto.server.activateAccount).toHaveBeenCalled();
    expect(fromAgent.com.atproto.server.deactivateAccount).toHaveBeenCalled();
  });
});
