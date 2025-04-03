import type { AtpAgent } from '@atproto/api';
import type { TypeOf } from 'zod';
import { custom, enum as zEnum, object, string, union } from 'zod';

import { isEmail, isHandle, isHttpUrl } from '../utils/index.js';

export const migrationStateValues = Object.freeze([
  'Ready',
  'Initialized',
  'CreatedNewAccount',
  'MigratedData',
  'RequestedPlcOperation',
  'MigratedIdentity',
  'Finalized',
] as const);

export const MigrationStateSchema = zEnum(migrationStateValues);

export type MigrationState = TypeOf<typeof MigrationStateSchema>;

const stateIndices = Object.freeze(
  migrationStateValues.reduce<Record<MigrationState, number>>(
    (acc, state, index) => {
      acc[state] = index;
      return acc;
    },
    {} as Record<MigrationState, number>,
  ),
);

const getStateIndex = (state: MigrationState): number => stateIndices[state];

export const stateUtils = {
  gte: (state: MigrationState, other: MigrationState): boolean =>
    getStateIndex(state) >= getStateIndex(other),
};

const HttpUrl = custom<string>(isHttpUrl, 'Must be a valid HTTP or HTTPS URL');
const Handle = custom<string>(isHandle, 'Must be a valid handle');
const Email = custom<string>(isEmail, 'Must be a valid email address');
export const NonEmptyStringSchema = custom<string>(
  (value) => typeof value === 'string' && value.length > 0,
  'Must be a non-empty string',
);

/**
 * @param handle - The handle to validate.
 * @param pdsHostname - The PDS hostname.
 * @returns `true` if the handle is a subdomain of the PDS hostname, `false` otherwise.
 */
export const isPdsSubdomain = (handle: string, pdsHostname: string): boolean =>
  handle.endsWith(`.${pdsHostname}`);

export const MigrationCredentialsSchema = object({
  oldPdsUrl: HttpUrl,
  newPdsUrl: HttpUrl,
  oldHandle: Handle,
  oldPassword: NonEmptyStringSchema,
  newHandle: union([
    object({
      temporaryHandle: Handle,
      finalHandle: Handle,
    }),
    object({
      handle: Handle,
    }),
  ]),
  newEmail: Email,
  newPassword: NonEmptyStringSchema,
  inviteCode: NonEmptyStringSchema,
}).refine(
  (data) =>
    'handle' in data.newHandle ||
    isPdsSubdomain(
      data.newHandle.temporaryHandle,
      new URL(data.newPdsUrl).hostname,
    ),
  {
    message: 'Temporary new handle must be a subdomain of the new PDS hostname',
  },
);

export const makeMigrationCredentials = (
  value: unknown,
): MigrationCredentials => MigrationCredentialsSchema.parse(value);

const InitialSerializedMigration = object({
  state: MigrationStateSchema.exclude(['MigratedIdentity', 'Finalized']),
  credentials: MigrationCredentialsSchema,
  confirmationToken: string().optional(),
});

const UltimateSerializedMigration = object({
  state: MigrationStateSchema.extract(['MigratedIdentity', 'Finalized']),
  credentials: MigrationCredentialsSchema,
  confirmationToken: string(),
  newPrivateKey: string(),
});

export const SerializedMigrationSchema = union([
  InitialSerializedMigration,
  UltimateSerializedMigration,
]);

export type SerializedMigration = TypeOf<typeof SerializedMigrationSchema>;

const PartialMigrationSchema = object({
  credentials: object({}).passthrough(),
  confirmationToken: string().optional(),
}).strict();

/**
 * A "partial" migration is a migration with only the credentials and, optionally,
 * a confirmation token set. We will assume that such a migration is in the
 * "Ready" state.
 */
export type PartialSerializedMigration = TypeOf<typeof PartialMigrationSchema>;

export const isPartialSerializedMigration = (
  value: unknown,
): value is PartialSerializedMigration =>
  PartialMigrationSchema.safeParse(value).success;

export type MigrationCredentials = TypeOf<typeof MigrationCredentialsSchema>;

export const getMigrationHandle = (credentials: MigrationCredentials) => {
  if ('temporaryHandle' in credentials.newHandle) {
    return credentials.newHandle.temporaryHandle;
  }
  return credentials.newHandle.handle;
};

export type AgentPair = {
  oldAgent: AtpAgent;
  newAgent: AtpAgent;
  accountDid: string;
};

export type PlcOperationParams = {
  token: string;
  rotationKeys: string[];
  alsoKnownAs?: string[];
  services?: Record<string, unknown>;
};
