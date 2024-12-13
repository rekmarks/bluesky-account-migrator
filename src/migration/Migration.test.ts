import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeMockCredentials, mockAccountDid } from '../../test/utils.js';
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
    oldAgent: { logout: vi.fn() },
    newAgent: { logout: vi.fn() },
    accountDid: mockAccountDid,
  }) as unknown as AgentPair;

const agentsMatcher = expect.objectContaining({
  oldAgent: expect.objectContaining({ logout: expect.any(Function) }),
  newAgent: expect.objectContaining({ logout: expect.any(Function) }),
  accountDid: mockAccountDid,
});

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
        MigrationState.CreatedNewAccount,
      );
      expect(migration.accountDid).toBe(mockAccountDid);
    });
  });

  describe('run', () => {
    it('executes all transitions in order', async () => {
      const migration = new Migration({
        credentials: mockCredentials,
        confirmationToken: mockToken,
      });

      expect(await migration.run()).toBe(MigrationState.Finalized);

      // Verify all transitions were called in order
      expect(operations.initializeAgents).toHaveBeenCalledWith({
        credentials: mockCredentials,
      });
      expect(operations.createNewAccount).toHaveBeenCalledWith({
        agents: agentsMatcher,
        credentials: mockCredentials,
      });
      expect(operations.migrateData).toHaveBeenCalledWith(agentsMatcher);
      expect(operations.migrateIdentity).toHaveBeenCalledWith(
        agentsMatcher,
        mockToken,
      );
      expect(operations.finalizeMigration).toHaveBeenCalledWith(agentsMatcher);

      // Verify final state
      expect(migration.newPrivateKey).toBe(mockPrivateKey);
    });

    it('runs migration with given agents from Initialized state', async () => {
      const agents = makeMockAgents();
      const migration = new Migration(
        {
          credentials: mockCredentials,
          agents,
          confirmationToken: mockToken,
        },
        MigrationState.Initialized,
      );

      expect(await migration.run()).toBe(MigrationState.Finalized);
      expect(agents.oldAgent.logout).toHaveBeenCalled();
      expect(agents.newAgent.logout).toHaveBeenCalled();
    });

    it('stops and resumes if confirmation token is missing during RequestedPlcOperation state', async () => {
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
    it('setting confirmationToken updates token in params', async () => {
      const migration = new Migration(
        { credentials: mockCredentials, agents: makeMockAgents() },
        MigrationState.MigratedData,
      );

      migration.confirmationToken = mockToken;
      await migration.run();

      expect(operations.migrateIdentity).toHaveBeenCalledWith(
        agentsMatcher,
        mockToken,
      );
    });
  });
});
