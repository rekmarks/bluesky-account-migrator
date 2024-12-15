import type { AtpAgent } from '@atproto/api';
import type { HeadersMap } from '@atproto/xrpc';
import type { Mocked } from 'vitest';
import { vi } from 'vitest';

import type { MigrationCredentials } from '../src/migration/types.js';

export const makeMockCredentials = (): MigrationCredentials => ({
  oldPdsUrl: 'https://old.bsky.social',
  newPdsUrl: 'https://new.bsky.social',
  oldHandle: 'old.handle.com',
  oldPassword: 'oldpass123',
  newHandle: 'new.handle.com',
  newEmail: 'new@email.com',
  newPassword: 'newpass123',
  inviteCode: 'invite-123',
});

export const mockAccountDid = 'did:plc:testuser123';

export const makeXrpcResponse = <Data>(
  data: Data,
  headers: HeadersMap = {},
) => ({
  success: true,
  headers,
  data,
});

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
