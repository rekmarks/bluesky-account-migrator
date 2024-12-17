import type { AtpAgent } from '@atproto/api';
import type { TypeOf } from 'zod';
import { object, string, enum as zEnum, union } from 'zod';

const migrationStateValues = Object.freeze([
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
  lt: (state: MigrationState, other: MigrationState): boolean =>
    getStateIndex(state) < getStateIndex(other),

  gte: (state: MigrationState, other: MigrationState): boolean =>
    getStateIndex(state) >= getStateIndex(other),
};

const MigrationCredentials = object({
  oldPdsUrl: string(),
  newPdsUrl: string(),
  oldHandle: string(),
  oldPassword: string(),
  newHandle: string(),
  newEmail: string(),
  newPassword: string(),
  inviteCode: string(),
});

const InitialSerializedMigration = object({
  state: MigrationStateSchema.exclude(['MigratedIdentity', 'Finalized']),
  credentials: MigrationCredentials,
  confirmationToken: string().optional(),
});

const UltimateSerializedMigration = object({
  state: MigrationStateSchema.extract(['MigratedIdentity', 'Finalized']),
  credentials: MigrationCredentials,
  confirmationToken: string(),
  newPrivateKey: string(),
});

export const SerializedMigrationSchema = union([
  InitialSerializedMigration,
  UltimateSerializedMigration,
]);

export type SerializedMigration = TypeOf<typeof SerializedMigrationSchema>;

export type MigrationCredentials = TypeOf<typeof MigrationCredentials>;

export type AgentPair = {
  oldAgent: AtpAgent;
  newAgent: AtpAgent;
  accountDid: string;
};

export type PlcOperationParams = {
  token: string;
  rotationKeys: string[];
  alsoKnownAs?: string[];
  services?: Record<string, { type: string; endpoint: string }>;
};
