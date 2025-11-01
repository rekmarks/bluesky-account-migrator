import type { AtpAgent } from '@atproto/api';
import type { HeadersMap } from '@atproto/xrpc';
import type { Mock, Mocked } from 'vitest';
import { vi } from 'vitest';

import type { Migration, operations } from '../src/migration/index.js';
import type {
  AccountStatus,
  MigrationCredentials,
  MigrationState,
  SerializedMigration,
} from '../src/migration/types.js';

export type MockMigration = {
  credentials: MigrationCredentials;
  confirmationToken?: string | undefined;
  newPrivateKey?: string | undefined;
  run: Mock<() => Promise<MigrationState>>;
  runIter: Mock<() => AsyncGenerator<MigrationState>>;
  state: MigrationState;
  serialize: Mock<() => SerializedMigration>;
  deserialize: Mock<() => Migration>;
};

export const makeMockCredentials = (): MigrationCredentialsWithHandle => ({
  oldPdsUrl: 'https://bsky.social',
  newPdsUrl: 'https://foo.com',
  oldHandle: 'old.handle.com',
  oldPassword: 'oldpass123',
  newHandle: { handle: 'new.foo.com' },
  newEmail: 'new@email.com',
  newPassword: 'newpass123',
  inviteCode: 'invite-123',
});

export const makeMockCredentialsWithFinalHandle = (
  finalHandle: string,
): MigrationCredentialsWithFinalHandle => ({
  ...makeMockCredentials(),
  newHandle: {
    temporaryHandle: 'new.foo.com',
    finalHandle,
  },
});

export const makeMockAccountStatus = (
  options: Partial<AccountStatus> = {},
): AccountStatus => ({
  activated: true,
  validDid: true,
  repoCommit: 'commit123',
  repoRev: 'rev123',
  repoBlocks: 100,
  indexedRecords: 50,
  privateStateValues: 10,
  expectedBlobs: 20,
  importedBlobs: 20,
  ...options,
});

export const makeMockAccountStatuses = (
  oldOptions: Partial<AccountStatus> = {},
  newOptions: Partial<AccountStatus> = { activated: false },
): { old: AccountStatus; new: AccountStatus } => ({
  old: makeMockAccountStatus(oldOptions),
  new: makeMockAccountStatus(newOptions),
});

export type MigrationCredentialsWithHandle = Exclude<
  MigrationCredentials,
  'newHandle'
> & {
  newHandle: {
    handle: string;
  };
};

export type MigrationCredentialsWithFinalHandle = Exclude<
  MigrationCredentials,
  'newHandle'
> & {
  newHandle: {
    temporaryHandle: string;
    finalHandle: string;
  };
};

export const assertHasHandle = (
  credentials: MigrationCredentials,
): asserts credentials is MigrationCredentialsWithHandle => {
  if ('handle' in credentials.newHandle) {
    return;
  }
  throw new Error('handle is not defined');
};

export const assertHasFinalHandle: (
  credentials: MigrationCredentials,
) => asserts credentials is MigrationCredentialsWithFinalHandle = (
  credentials,
) => {
  if ('finalHandle' in credentials.newHandle) {
    return;
  }
  throw new Error('finalHandle is not defined');
};

export const makeMockOperations = (
  mocks: Partial<typeof operations> = {},
): typeof operations => ({
  initializeAgents: vi.fn(),
  createNewAccount: vi.fn(),
  migrateData: vi.fn(),
  requestPlcOperation: vi.fn(),
  migrateIdentity: vi.fn(),
  checkAccountStatus: vi.fn(),
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
          activateAccount: vi.fn(),
          checkAccountStatus: vi.fn(),
          createAccount: vi.fn(),
          deactivateAccount: vi.fn(),
          describeServer: vi.fn(),
          getServiceAuth: vi.fn(),
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
          updateHandle: vi.fn(),
        },
      },
    },
  } as unknown as Mocked<AtpAgent>;
}

/**
 * Pick non-`#` properties from a type.
 *
 * @template Type - The type to pick public properties from.
 */
export type PickPublic<Type> = Pick<
  Type,
  {
    [K in keyof Type]: K extends `#${string}` ? never : K;
  }[keyof Type]
>;
