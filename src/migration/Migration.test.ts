import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { Migration, MigrationState, TransitionMap } from './Migration.js';
import type { AgentPair, MigrationCredentials } from './types.js';
import { makeMockCredentials } from '../../test/utils.js';

const mockAgentPair: AgentPair = {
  fromAgent: {},
  toAgent: {},
  accountDid: 'did:plc:test123',
} as unknown as AgentPair;

const mockPrivateKey = 'mock-private-key';
const mockToken = 'mock-token';

type Mutable<T> = T extends Readonly<infer U> ? U : never;

const makeMockTransitions = (): Mocked<Mutable<TransitionMap>> => ({
  [MigrationState.Ready]: vi.fn().mockResolvedValue(mockAgentPair),
  [MigrationState.Initialized]: vi.fn().mockResolvedValue(undefined),
  [MigrationState.NewAccount]: vi.fn().mockResolvedValue(undefined),
  [MigrationState.MigratedData]: vi.fn().mockResolvedValue(mockPrivateKey),
  [MigrationState.MigratedIdentity]: vi.fn().mockResolvedValue(undefined),
  [MigrationState.Finalized]: vi.fn().mockResolvedValue(undefined),
});

describe('Migration', () => {
  let mockCredentials: MigrationCredentials;
  let mockTransitions: Mocked<Mutable<TransitionMap>>;

  beforeEach(() => {
    mockCredentials = makeMockCredentials();
    mockTransitions = makeMockTransitions();
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      const migration = new Migration({ credentials: mockCredentials });
      expect(migration.accountDid).toBeUndefined();
      expect(migration.toAccountPrivateKey).toBeUndefined();
    });

    it('accepts initial state', () => {
      const migration = new Migration(
        { credentials: mockCredentials, agents: mockAgentPair },
        MigrationState.NewAccount,
      );
      expect(migration.accountDid).toBe(mockAgentPair.accountDid);
    });
  });

  describe('run', () => {
    it('executes all transitions in order', async () => {
      const migration = new Migration(
        {
          credentials: mockCredentials,
          confirmationToken: mockToken,
        },
        MigrationState.Ready,
        mockTransitions,
      );

      expect(await migration.run()).toBe(MigrationState.Finalized);

      // Verify all transitions were called in order
      expect(mockTransitions[MigrationState.Ready]).toHaveBeenCalledWith(
        mockCredentials,
      );
      expect(mockTransitions[MigrationState.Initialized]).toHaveBeenCalledWith(
        mockAgentPair,
        mockCredentials,
      );
      expect(mockTransitions[MigrationState.NewAccount]).toHaveBeenCalledWith(
        mockAgentPair,
      );
      expect(mockTransitions[MigrationState.MigratedData]).toHaveBeenCalledWith(
        mockAgentPair,
        mockToken,
      );
      expect(
        mockTransitions[MigrationState.MigratedIdentity],
      ).toHaveBeenCalledWith(mockAgentPair);
      expect(mockTransitions[MigrationState.Finalized]).not.toHaveBeenCalled();

      // Verify final state
      expect(migration.toAccountPrivateKey).toBe(mockPrivateKey);
    });

    it('runs migration from the Initialized state', async () => {
      const migration = new Migration(
        {
          credentials: mockCredentials,
          agents: mockAgentPair,
          confirmationToken: mockToken,
        },
        MigrationState.Initialized,
        mockTransitions,
      );
      expect(await migration.run()).toBe(MigrationState.Finalized);
    });

    it('exits early if confirmation token is missing during MigratedData state', async () => {
      const migration = new Migration(
        { credentials: mockCredentials },
        MigrationState.Ready,
        mockTransitions,
      );

      expect(await migration.run()).toBe(MigrationState.MigratedData);
      expect(
        mockTransitions[MigrationState.MigratedData],
      ).not.toHaveBeenCalled();

      migration.setConfirmationToken(mockToken);
      expect(await migration.run()).toBe(MigrationState.Finalized);
    });

    it('throws error if transition returns invalid result type', async () => {
      mockTransitions[MigrationState.Ready] = vi
        .fn()
        .mockResolvedValue('invalid-result');

      const migration = new Migration(
        { credentials: mockCredentials },
        MigrationState.Ready,
        mockTransitions,
      );

      await expect(migration.run()).rejects.toThrow(
        'Migration failed during "0: Ready": Transition returned invalid result of type "string"',
      );
    });
  });

  describe('setters', () => {
    it('setAgents updates agents in params', () => {
      const migration = new Migration({ credentials: mockCredentials });
      migration.setAgents(mockAgentPair);
      expect(migration.accountDid).toBe(mockAgentPair.accountDid);
    });

    it('setConfirmationToken updates token in params', async () => {
      const migration = new Migration(
        { credentials: mockCredentials, agents: mockAgentPair },
        MigrationState.MigratedData,
        mockTransitions,
      );

      migration.setConfirmationToken(mockToken);
      await migration.run();

      expect(mockTransitions[MigrationState.MigratedData]).toHaveBeenCalledWith(
        mockAgentPair,
        mockToken,
      );
    });
  });
});
