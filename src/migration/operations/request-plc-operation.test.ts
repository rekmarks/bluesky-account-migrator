import { describe, it, expect, vi } from 'vitest';
import { requestPlcOperation } from './request-plc-operation.js';
import { makeMockAgent, mockAccountDid } from '../../../test/utils.js';

describe('requestPlcOperation', () => {
  it('should request a PLC operation signature from the old PDS', async () => {
    const oldAgent = makeMockAgent();
    await requestPlcOperation({
      oldAgent,
      newAgent: makeMockAgent(),
      accountDid: mockAccountDid,
    });

    expect(
      oldAgent.com.atproto.identity.requestPlcOperationSignature,
    ).toHaveBeenCalled();
  });
});
