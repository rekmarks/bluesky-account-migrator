import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Migration } from './Migration.js';
import * as operations from './operations/index.js';
import { MigrationStateSchema, type AgentPair } from './types.js';
import type { MigrationCredentialsWithHandle } from '../../test/utils.js';
import {
  makeMockAccountStatuses,
  makeMockCredentials,
  mockAccountDid,
} from '../../test/utils.js';

vi.mock('./operations/index.js', () => ({
  initializeAgents: vi.fn(),
  createNewAccount: vi.fn(),
  migrateData: vi.fn(),
  requestPlcOperation: vi.fn(),
  migrateIdentity: vi.fn(),
  checkAccountStatus: vi.fn(),
  finalize: vi.fn(),
}));

const makeMockAgents = (): AgentPair =>
  ({
    oldAgent: { login: vi.fn(), logout: vi.fn() },
    newAgent: { login: vi.fn(), logout: vi.fn() },
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
  let mockCredentials: MigrationCredentialsWithHandle;

  beforeEach(() => {
    mockCredentials = makeMockCredentials();
    vi.mocked(operations.initializeAgents).mockResolvedValue(makeMockAgents());
    vi.mocked(operations.migrateIdentity).mockResolvedValue(mockPrivateKey);
    vi.mocked(operations.checkAccountStatus).mockResolvedValue({
      accountStatuses: makeMockAccountStatuses(),
    });
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      const migration = new Migration({ credentials: mockCredentials });
      expect(migration.accountDid).toBeUndefined();
      expect(migration.newPrivateKey).toBeUndefined();
    });

    it('accepts initial state', () => {
      const migration = new Migration(
        { credentials: mockCredentials },
        'CreatedNewAccount',
        makeMockAgents(),
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

      expect(await migration.run()).toBe('Finalized');

      // Verify all transitions were called in order
      expect(operations.initializeAgents).toHaveBeenCalledWith({
        credentials: mockCredentials,
      });
      expect(operations.createNewAccount).toHaveBeenCalledWith({
        agents: agentsMatcher,
        credentials: mockCredentials,
      });
      expect(operations.migrateData).toHaveBeenCalledWith(agentsMatcher);
      expect(operations.migrateIdentity).toHaveBeenCalledWith({
        agents: agentsMatcher,
        confirmationToken: mockToken,
      });
      expect(operations.checkAccountStatus).toHaveBeenCalledWith({
        agents: agentsMatcher,
      });
      expect(operations.finalize).toHaveBeenCalledWith({
        agents: agentsMatcher,
        credentials: mockCredentials,
      });

      // Verify final state
      expect(migration.newPrivateKey).toBe(mockPrivateKey);
    });

    it('runs migration with given agents from Initialized state', async () => {
      const agents = makeMockAgents();
      const migration = new Migration(
        {
          credentials: mockCredentials,
          confirmationToken: mockToken,
        },
        'Initialized',
        agents,
      );

      expect(await migration.run()).toBe('Finalized');
      expect(agents.oldAgent.logout).toHaveBeenCalled();
      expect(agents.newAgent.logout).toHaveBeenCalled();
    });

    it('stops and resumes if confirmation token is missing during RequestedPlcOperation state', async () => {
      const migration = new Migration(
        { credentials: mockCredentials },
        'Ready',
      );

      expect(await migration.run()).toBe('RequestedPlcOperation');
      expect(operations.migrateIdentity).not.toHaveBeenCalled();

      migration.confirmationToken = mockToken;
      expect(await migration.run()).toBe('Finalized');
    });
  });

  describe('runIter', () => {
    it('iterates through all states', async () => {
      const states = [];
      const migration = new Migration({
        credentials: mockCredentials,
        confirmationToken: mockToken,
      });
      for await (const state of migration.runIter()) {
        states.push(state);
      }

      expect(states).toStrictEqual(Object.values(MigrationStateSchema.Values));
    });

    it('stops and resumes if confirmation token is missing during RequestedPlcOperation state', async () => {
      const states = [];
      const migration = new Migration({ credentials: mockCredentials });
      for await (const state of migration.runIter()) {
        states.push(state);
      }

      expect(states).toStrictEqual([
        'Ready',
        'Initialized',
        'CreatedNewAccount',
        'MigratedData',
        'RequestedPlcOperation',
      ]);

      states.length = 0;
      migration.confirmationToken = mockToken;
      for await (const state of migration.runIter()) {
        states.push(state);
      }

      expect(states).toStrictEqual([
        'RequestedPlcOperation',
        'MigratedIdentity',
        'CheckedAccountStatus',
        'Finalized',
      ]);
    });
  });

  describe('getters and setters', () => {
    it('setting confirmationToken updates token in params', async () => {
      const migration = new Migration(
        { credentials: mockCredentials },
        'MigratedData',
        makeMockAgents(),
      );

      migration.confirmationToken = mockToken;
      await migration.run();

      expect(operations.migrateIdentity).toHaveBeenCalledWith({
        agents: agentsMatcher,
        confirmationToken: mockToken,
      });
    });
  });

  describe('serialize', () => {
    it('serializes a migration in the Ready state', () => {
      const migration = new Migration({ credentials: mockCredentials });
      const serialized = migration.serialize();
      expect(serialized).toStrictEqual({
        state: 'Ready',
        credentials: mockCredentials,
      });
    });

    it('serializes a migration in the RequestedPlcOperation state', () => {
      const migration = new Migration(
        {
          credentials: mockCredentials,
          confirmationToken: mockToken,
        },
        'RequestedPlcOperation',
        makeMockAgents(),
      );
      const initialState = migration.serialize();

      expect(initialState).toStrictEqual({
        state: 'RequestedPlcOperation',
        credentials: mockCredentials,
        confirmationToken: mockToken,
      });
    });

    it('serializes a migration after running from RequestedPlcOperation state', async () => {
      const migration = new Migration(
        {
          credentials: mockCredentials,
          confirmationToken: mockToken,
        },
        'RequestedPlcOperation',
        makeMockAgents(),
      );

      vi.mocked(operations.migrateIdentity).mockResolvedValue(mockPrivateKey);
      await migration.run();
      const finalState = migration.serialize();

      expect(finalState).toStrictEqual({
        state: 'Finalized',
        credentials: mockCredentials,
        confirmationToken: mockToken,
        newPrivateKey: mockPrivateKey,
        accountStatuses: makeMockAccountStatuses(),
      });
    });
  });

  describe('deserialize', () => {
    it('deserializes a migration in the Ready state', async () => {
      const migration = await Migration.deserialize({
        state: 'Ready',
        credentials: mockCredentials,
      });

      expect(migration.state).toBe('Ready');
    });

    it('deserializes a migration in the RequestedPlcOperation state', async () => {
      vi.mocked(operations.initializeAgents).mockResolvedValue(
        makeMockAgents(),
      );

      const migration = await Migration.deserialize({
        state: 'RequestedPlcOperation',
        credentials: mockCredentials,
        confirmationToken: mockToken,
      });

      expect(migration.state).toBe('RequestedPlcOperation');
      expect(migration.confirmationToken).toBe(mockToken);
    });

    it('deserializes a migration in the Finalized state', async () => {
      const migration = await Migration.deserialize({
        state: 'Finalized',
        credentials: mockCredentials,
        confirmationToken: mockToken,
        newPrivateKey: mockPrivateKey,
        accountStatuses: makeMockAccountStatuses(),
      });

      expect(migration.state).toBe('Finalized');
      expect(migration.confirmationToken).toBe(mockToken);
      expect(migration.newPrivateKey).toBe(mockPrivateKey);
    });

    it('deserializing a migration in the ready state does not restore agents', async () => {
      await Migration.deserialize({
        state: 'Ready',
        credentials: mockCredentials,
      });

      expect(operations.initializeAgents).not.toHaveBeenCalled();
    });

    it('deserializing a migration in the CreatedNewAccount state restores agents', async () => {
      const mockAgents = makeMockAgents();
      vi.mocked(operations.initializeAgents).mockResolvedValue(mockAgents);

      await Migration.deserialize({
        state: 'CreatedNewAccount',
        credentials: mockCredentials,
      });

      expect(operations.initializeAgents).toHaveBeenCalledOnce();
      expect(operations.initializeAgents).toHaveBeenCalledWith({
        credentials: mockCredentials,
      });
      expect(mockAgents.newAgent.login).toHaveBeenCalledOnce();
      expect(mockAgents.newAgent.login).toHaveBeenCalledWith({
        identifier: mockCredentials.newHandle.handle,
        password: mockCredentials.newPassword,
      });
    });

    it('deserializing a migration in the MigratedIdentity state restores agents', async () => {
      const mockAgents = makeMockAgents();
      vi.mocked(operations.initializeAgents).mockResolvedValue(mockAgents);

      await Migration.deserialize({
        state: 'MigratedIdentity',
        credentials: mockCredentials,
        confirmationToken: mockToken,
        newPrivateKey: mockPrivateKey,
      });

      expect(operations.initializeAgents).toHaveBeenCalledOnce();
      expect(operations.initializeAgents).toHaveBeenCalledWith({
        credentials: mockCredentials,
      });
      expect(mockAgents.newAgent.login).toHaveBeenCalledOnce();
      expect(mockAgents.newAgent.login).toHaveBeenCalledWith({
        identifier: mockCredentials.newHandle.handle,
        password: mockCredentials.newPassword,
      });
    });

    it.each(['CheckedAccountStatus', 'Finalized'])(
      'deserializing a migration in the %s state checks account statuses',
      async (state) => {
        const migration = await Migration.deserialize({
          state,
          credentials: mockCredentials,
          confirmationToken: mockToken,
          newPrivateKey: mockPrivateKey,
        });
        expect(migration.accountStatuses).toStrictEqual(
          makeMockAccountStatuses(),
        );
      },
    );

    it('re-checking account statuses overwrites old account statuses', async () => {
      const migration = await Migration.deserialize({
        state: 'CheckedAccountStatus',
        credentials: mockCredentials,
        confirmationToken: mockToken,
        newPrivateKey: mockPrivateKey,
        accountStatuses: makeMockAccountStatuses({ importedBlobs: 999 }),
      });
      expect(migration.accountStatuses).toStrictEqual(
        makeMockAccountStatuses(),
      );
    });
  });
});
