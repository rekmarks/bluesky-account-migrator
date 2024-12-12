import { describe, it, expect, vi } from 'vitest';
import { migrateIdentity } from './identity.js';
import {
  makeMockAgent,
  makeXrpcResponse,
  mockAccountDid,
} from '../../../test/utils.js';
import { Secp256k1Keypair } from '@atproto/crypto';

vi.mock('@atproto/crypto', () => ({
  Secp256k1Keypair: {
    create: vi.fn(),
  },
}));

describe('migrateIdentity', () => {
  it('should perform identity migration successfully', async () => {
    const oldAgent = makeMockAgent();
    const newAgent = makeMockAgent();
    const mockToken = 'test-token';
    const mockDid = 'did:key:mock123';

    // @ts-expect-error
    vi.mocked(Secp256k1Keypair.create).mockResolvedValue({
      did: () => mockDid,
      export: () => Promise.resolve(new Uint8Array([1, 2, 3])),
    });

    vi.mocked(
      newAgent.com.atproto.identity.getRecommendedDidCredentials,
    ).mockResolvedValue(makeXrpcResponse({ rotationKeys: ['existing-key'] }));

    vi.mocked(oldAgent.com.atproto.identity.signPlcOperation).mockResolvedValue(
      makeXrpcResponse({ operation: 'signed-operation' }),
    );

    const result = await migrateIdentity(
      { oldAgent: oldAgent, newAgent: newAgent, accountDid: mockAccountDid },
      mockToken,
    );

    expect(
      oldAgent.com.atproto.identity.requestPlcOperationSignature,
    ).toHaveBeenCalled();
    expect(
      newAgent.com.atproto.identity.getRecommendedDidCredentials,
    ).toHaveBeenCalled();
    expect(oldAgent.com.atproto.identity.signPlcOperation).toHaveBeenCalledWith(
      {
        token: mockToken,
        rotationKeys: [mockDid, 'existing-key'],
      },
    );
    expect(
      newAgent.com.atproto.identity.submitPlcOperation,
    ).toHaveBeenCalledWith({
      operation: 'signed-operation',
    });
    expect(result).toBe('010203'); // hex string of mockPrivateKey
  });

  it('should throw error if no rotation keys provided', async () => {
    const oldAgent = makeMockAgent();
    const newAgent = makeMockAgent();

    // @ts-expect-error
    vi.mocked(Secp256k1Keypair.create).mockResolvedValue({
      did: () => 'did:key:mock123',
      export: () => Promise.resolve(new Uint8Array([1, 2, 3])),
    });

    vi.mocked(
      newAgent.com.atproto.identity.getRecommendedDidCredentials,
    ).mockResolvedValue(makeXrpcResponse({}));

    await expect(
      migrateIdentity(
        { oldAgent: oldAgent, newAgent: newAgent, accountDid: mockAccountDid },
        'token',
      ),
    ).rejects.toThrow('New PDS did not provide any rotation keys');
  });
});
