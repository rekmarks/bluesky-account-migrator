import { describe, it, expect, vi } from 'vitest';
import { migrateIdentity } from './identity.js';
import { makeMockAgent, mockAccountDid } from '../../../test/utils.js';
import { Secp256k1Keypair } from '@atproto/crypto';

vi.mock('@atproto/crypto', () => ({
  Secp256k1Keypair: {
    create: vi.fn(),
  },
}));

describe('migrateIdentity', () => {
  it('should perform identity migration successfully', async () => {
    const fromAgent = makeMockAgent();
    const toAgent = makeMockAgent();
    const mockToken = 'test-token';
    const mockDid = 'did:key:mock123';

    // @ts-expect-error
    vi.mocked(Secp256k1Keypair.create).mockResolvedValue({
      did: () => mockDid,
      export: () => Promise.resolve(new Uint8Array([1, 2, 3])),
    });

    vi.mocked(
      toAgent.com.atproto.identity.getRecommendedDidCredentials,
    ).mockResolvedValue(
      // @ts-expect-error
      {
        data: {
          rotationKeys: ['existing-key'],
        },
      },
    );

    vi.mocked(
      fromAgent.com.atproto.identity.signPlcOperation,
    ).mockResolvedValue(
      // @ts-expect-error
      {
        data: { operation: 'signed-operation' },
      },
    );

    const result = await migrateIdentity(
      { fromAgent: fromAgent, toAgent: toAgent, accountDid: mockAccountDid },
      mockToken,
    );

    expect(
      fromAgent.com.atproto.identity.requestPlcOperationSignature,
    ).toHaveBeenCalled();
    expect(
      toAgent.com.atproto.identity.getRecommendedDidCredentials,
    ).toHaveBeenCalled();
    expect(
      fromAgent.com.atproto.identity.signPlcOperation,
    ).toHaveBeenCalledWith({
      token: mockToken,
      rotationKeys: [mockDid, 'existing-key'],
    });
    expect(
      toAgent.com.atproto.identity.submitPlcOperation,
    ).toHaveBeenCalledWith({
      operation: 'signed-operation',
    });
    expect(result).toBe('010203'); // hex string of mockPrivateKey
  });

  it('should throw error if no rotation keys provided', async () => {
    const fromAgent = makeMockAgent();
    const toAgent = makeMockAgent();

    // @ts-expect-error
    vi.mocked(Secp256k1Keypair.create).mockResolvedValue({
      did: () => 'did:key:mock123',
      export: () => Promise.resolve(new Uint8Array([1, 2, 3])),
    });

    vi.mocked(
      toAgent.com.atproto.identity.getRecommendedDidCredentials,
    ).mockResolvedValue(
      // @ts-expect-error
      {
        data: {},
      },
    );

    await expect(
      migrateIdentity(
        { fromAgent: fromAgent, toAgent: toAgent, accountDid: mockAccountDid },
        'token',
      ),
    ).rejects.toThrow('No rotation key provided');
  });
});
