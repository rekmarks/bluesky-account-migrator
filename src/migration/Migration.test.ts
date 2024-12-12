import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockCredentials } from '../../test/utils.js';
import * as operations from './operations/index.js';
import { Migration, MigrationState } from './Migration.js';
import type { AgentPair, MigrationCredentials } from './types.js';

vi.mock('./operations/index.js', () => ({
  initializeAgents: vi.fn(),
  createNewAccount: vi.fn(),
  migrateData: vi.fn(),
  requestPlcOperation: vi.fn(),
  migrateIdentity: vi.fn(),
  finalizeMigration: vi.fn(),
}));

const makeMockAgents = (): AgentPair =>
  ({
    oldAgent: {},
    newAgent: {},
    accountDid: 'did:plc:test123',
  }) as unknown as AgentPair;

const mockPrivateKey = 'mock-private-key';
const mockToken = 'mock-token';

describe('Migration', () => {
  let mockCredentials: MigrationCredentials;

  beforeEach(() => {
    mockCredentials = makeMockCredentials();
    vi.mocked(operations.initializeAgents).mockResolvedValue(makeMockAgents());
    vi.mocked(operations.migrateIdentity).mockResolvedValue(mockPrivateKey);
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      const migration = new Migration({ credentials: mockCredentials });
      expect(migration.accountDid).toBeUndefined();
      expect(migration.newPrivateKey).toBeUndefined();
    });

    it('accepts initial state', () => {
      const migration = new Migration(
        { credentials: mockCredentials, agents: makeMockAgents() },
        MigrationState.NewAccount,
      );
      expect(migration.accountDid).toBe(makeMockAgents().accountDid);
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
      );

      expect(await migration.run()).toBe(MigrationState.Finalized);

      // Verify all transitions were called in order
      expect(operations.initializeAgents).toHaveBeenCalledWith({
        credentials: mockCredentials,
      });
      expect(operations.createNewAccount).toHaveBeenCalledWith({
        agents: makeMockAgents(),
        credentials: mockCredentials,
      });
      expect(operations.migrateData).toHaveBeenCalledWith(makeMockAgents());
      expect(operations.migrateIdentity).toHaveBeenCalledWith(
        makeMockAgents(),
        mockToken,
      );
      expect(operations.finalizeMigration).toHaveBeenCalledWith(
        makeMockAgents(),
      );

      // Verify final state
      expect(migration.newPrivateKey).toBe(mockPrivateKey);
    });

    it('runs migration from the Initialized state', async () => {
      const migration = new Migration(
        {
          credentials: mockCredentials,
          agents: makeMockAgents(),
          confirmationToken: mockToken,
        },
        MigrationState.Initialized,
      );
      expect(await migration.run()).toBe(MigrationState.Finalized);
    });

    it('exits early if confirmation token is missing during RequestedPlcOperation state', async () => {
      const migration = new Migration(
        { credentials: mockCredentials },
        MigrationState.Ready,
      );

      expect(await migration.run()).toBe(MigrationState.RequestedPlcOperation);
      expect(operations.migrateIdentity).not.toHaveBeenCalled();

      migration.confirmationToken = mockToken;
      expect(await migration.run()).toBe(MigrationState.Finalized);
    });
  });

  describe('setters', () => {
    it('setting agents updates agents in params', () => {
      const migration = new Migration({ credentials: mockCredentials });
      migration.agents = makeMockAgents();
      expect(migration.accountDid).toBe(makeMockAgents().accountDid);
    });

    it('setting confirmationToken updates token in params', async () => {
      const migration = new Migration(
        { credentials: mockCredentials, agents: makeMockAgents() },
        MigrationState.MigratedData,
      );

      migration.confirmationToken = mockToken;
      await migration.run();

      expect(operations.migrateIdentity).toHaveBeenCalledWith(
        makeMockAgents(),
        mockToken,
      );
    });
  });
});
