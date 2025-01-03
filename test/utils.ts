import type { AtpAgent } from '@atproto/api';
import type { HeadersMap } from '@atproto/xrpc';
import type { Mock, Mocked } from 'vitest';
import { vi } from 'vitest';

import type { Migration, operations } from '../src/migration/index.js';
import type {
  MigrationCredentials,
  MigrationState,
  SerializedMigration,
} from '../src/migration/types.js';

export type MockMigration = {
  credentials: MigrationCredentials;
  confirmationToken?: string | undefined;
  newPrivateKey?: string | undefined;
  run: Mock<() => Promise<MigrationState>>;
  state: MigrationState;
  serialize: Mock<() => SerializedMigration>;
  deserialize: Mock<() => Migration>;
};

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

export const makeMockOperations = (
  mocks: Partial<typeof operations> = {},
): typeof operations => ({
  initializeAgents: vi.fn(),
  createNewAccount: vi.fn(),
  migrateData: vi.fn(),
  requestPlcOperation: vi.fn(),
  migrateIdentity: vi.fn(),
  finalize: vi.fn(),
  ...mocks,
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
