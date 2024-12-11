import { describe, it, expect } from 'vitest';
import { finalizeMigration } from './finalize.js';
import { makeMockAgent, mockAccountDid } from '../../../test/utils.js';

describe('finalizeMigration', () => {
  it('should activate new account and deactivate old account', async () => {
    const oldAgent = makeMockAgent();
    const newAgent = makeMockAgent();

    await finalizeMigration({
      oldAgent: oldAgent,
      newAgent: newAgent,
      accountDid: mockAccountDid,
    });

    expect(newAgent.com.atproto.server.activateAccount).toHaveBeenCalled();
    expect(oldAgent.com.atproto.server.deactivateAccount).toHaveBeenCalled();
  });
});
