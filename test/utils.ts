import { vi, beforeEach, Mocked } from 'vitest';
import { AtpAgent } from '@atproto/api';
import type { MigrationCredentials } from '../src/migration/types.js';

export const makeMockCredentials = (): MigrationCredentials => ({
  fromPdsUrl: 'https://old.bsky.social',
  toPdsUrl: 'https://new.bsky.social',
  fromHandle: 'old.handle.com',
  fromPassword: 'oldpass123',
  toHandle: 'new.handle.com',
  toEmail: 'new@email.com',
  toPassword: 'newpass123',
  inviteCode: 'invite-123',
});

export const mockAccountDid = 'did:plc:testuser123';

export function makeMockAgent(did?: string): Mocked<AtpAgent> {
  return {
    login: vi.fn().mockResolvedValue(undefined),
    session: did ? { did } : undefined,
    app: {
      bsky: {
        actor: {
          getPreferences: vi.fn(),
          putPreferences: vi.fn(),
        },
      },
    },
    com: {
      atproto: {
        server: {
          describeServer: vi.fn(),
          getServiceAuth: vi.fn(),
          createAccount: vi.fn(),
          activateAccount: vi.fn(),
          deactivateAccount: vi.fn(),
        },
        sync: {
          getRepo: vi.fn(),
          listBlobs: vi.fn(),
          getBlob: vi.fn(),
        },
        repo: {
          importRepo: vi.fn(),
          uploadBlob: vi.fn(),
        },
        identity: {
          requestPlcOperationSignature: vi.fn(),
          getRecommendedDidCredentials: vi.fn(),
          signPlcOperation: vi.fn(),
          submitPlcOperation: vi.fn(),
        },
      },
    },
  } as unknown as Mocked<AtpAgent>;
}
