import * as operations from './operations/index.js';
import { initializeAgents } from './operations/index.js';
import type {
  AgentPair,
  MigrationCredentials,
  MigrationState,
  SerializedMigration,
} from './types.js';
import {
  getMigrationHandle,
  MigrationStateSchema,
  SerializedMigrationSchema,
  stateUtils,
} from './types.js';
import { consume, handleUnknownError } from '../utils/index.js';

type BaseData = {
  credentials: MigrationCredentials;
  confirmationToken?: string | undefined;
};

type FinalData = {
  credentials: MigrationCredentials;
  confirmationToken: string;
  newPrivateKey: string;
};

const { enum: stateEnum } = MigrationStateSchema;

type Transitions = {
  [stateEnum.Ready]: {
    nextState: 'Initialized';
    agents: AgentPair;
  };
  [stateEnum.Initialized]: {
    nextState: 'CreatedNewAccount';
  };
  [stateEnum.CreatedNewAccount]: {
    nextState: 'MigratedData';
  };
  [stateEnum.MigratedData]: {
    nextState: 'RequestedPlcOperation';
  };
  [stateEnum.RequestedPlcOperation]:
    | {
        nextState: 'RequestedPlcOperation';
      }
    | {
        nextState: 'MigratedIdentity';
        data: FinalData;
      };
  [stateEnum.MigratedIdentity]: {
    nextState: 'Finalized';
  };
  [stateEnum.Finalized]: never;
};

type ExpectedData = {
  [stateEnum.Ready]: BaseData;
  [stateEnum.Initialized]: BaseData;
  [stateEnum.CreatedNewAccount]: BaseData;
  [stateEnum.MigratedData]: BaseData;
  [stateEnum.RequestedPlcOperation]: BaseData;
  [stateEnum.MigratedIdentity]: FinalData;
  [stateEnum.Finalized]: FinalData;
};

type StateMachineConfig = {
  [S in MigrationState]: (
    data: ExpectedData[S],
    agents: S extends 'Ready' ? never : AgentPair,
  ) => Promise<Transitions[S]>;
};

const stateMachineConfig: StateMachineConfig = {
  Ready: async ({ credentials }) => {
    return {
      nextState: 'Initialized',
      agents: await operations.initializeAgents({ credentials }),
    };
  },
  Initialized: async ({ credentials }, agents) => {
    await operations.createNewAccount({ agents, credentials });
    return {
      nextState: 'CreatedNewAccount',
    };
  },
  CreatedNewAccount: async (_data, agents) => {
    await operations.migrateData(agents);
    return {
      nextState: 'MigratedData',
    };
  },
  MigratedData: async (_data, agents) => {
    await operations.requestPlcOperation(agents);
    return {
      nextState: 'RequestedPlcOperation',
    };
  },
  RequestedPlcOperation: async ({ credentials, confirmationToken }, agents) => {
    if (!confirmationToken) {
      return {
        nextState: 'RequestedPlcOperation',
      };
    }

    const newPrivateKey = await operations.migrateIdentity({
      agents,
      confirmationToken,
    });
    return {
      nextState: 'MigratedIdentity',
      data: { credentials, confirmationToken, newPrivateKey },
    };
  },
  MigratedIdentity: async ({ credentials }, agents) => {
    await operations.finalize({ agents, credentials });
    return {
      nextState: 'Finalized',
    };
  },
  Finalized: async (_data) => {
    throw new Error('Cannot transition from Finalized state');
  },
};

export class Migration {
  #state: MigrationState;

  #agents?: AgentPair | undefined;

  #data: ExpectedData[MigrationState];

  constructor(
    initialData: BaseData,
    initialState: MigrationState = 'Ready',
    agents?: AgentPair,
  ) {
    this.#state = initialState;
    this.#data = initialData;
    this.#agents = agents;
  }

  /**
   * Serializes the migration state and data to a JSON string.
   *
   * **WARNING:** Will contain private keys and passwords in plaintext, if present.
   *
   * @returns The serialized migration data.
   */
  serialize(): SerializedMigration {
    // @ts-expect-error The job of this class is to ensure that the data is valid.
    const data: SerializedMigration = {
      ...this.#data,
      state: this.#state,
    };
    return data;
  }

  /**
   * Deserializes a migration from a JSON blob.
   *
   * @param data - The serialized migration data.
   * @throws {Error} If the migration data is invalid.
   * @returns The deserialized migration.
   */
  static async deserialize(data: Record<string, unknown>): Promise<Migration> {
    const parsed = Migration.#parseSerializedMigration(data);
    const initialData: BaseData = {
      credentials: parsed.credentials,
    };

    let agents: AgentPair | undefined;
    if (parsed.state !== 'Ready') {
      agents = await Migration.#restoreAgents(parsed);
    }
    if (parsed.confirmationToken !== undefined) {
      initialData.confirmationToken = parsed.confirmationToken;
    }

    const migration = new Migration(initialData, parsed.state, agents);

    if ('newPrivateKey' in parsed) {
      migration.#newPrivateKey = parsed.newPrivateKey;
    }
    return migration;
  }

  static #parseSerializedMigration(
    data: Record<string, unknown>,
  ): SerializedMigration {
    try {
      return SerializedMigrationSchema.parse(data);
    } catch (error) {
      const message = 'Invalid migration data: failed to parse';
      throw handleUnknownError(message, error);
    }
  }

  static async #restoreAgents(parsed: SerializedMigration): Promise<AgentPair> {
    const agents = await initializeAgents({ credentials: parsed.credentials });

    if (stateUtils.gte(parsed.state, 'CreatedNewAccount')) {
      await agents.newAgent.login({
        identifier: getMigrationHandle(parsed.credentials),
        password: parsed.credentials.newPassword,
      });
    }

    return agents;
  }

  get accountDid() {
    return this.#agents?.accountDid;
  }

  get newPrivateKey() {
    return 'newPrivateKey' in this.#data ? this.#data.newPrivateKey : undefined;
  }

  // eslint-disable-next-line accessor-pairs
  set #newPrivateKey(privateKey: string) {
    if ('newPrivateKey' in this.#data) {
      throw new Error(`Fatal: "newPrivateKey" already set`);
    }
    this.#data = { ...this.#data, newPrivateKey: privateKey };
  }

  get state() {
    return this.#state;
  }

  set confirmationToken(token: string) {
    if (this.#data.confirmationToken !== undefined) {
      throw new Error(`Fatal: "confirmationToken" already set`);
    }
    this.#data = { ...this.#data, confirmationToken: token };
  }

  get confirmationToken(): string | undefined {
    return 'confirmationToken' in this.#data
      ? this.#data.confirmationToken
      : undefined;
  }

  /**
   * Iterates through the migration state machine, yielding every state, including
   * the current state when this method is called.
   *
   * Either runs to completion or stops and returns after yielding the current
   * state if the migration is not ready to proceed.
   *
   * Calls {@link teardown} if the migration is finalized.
   *
   * @yields The current state of the migration.
   */
  async *runIter(): AsyncGenerator<MigrationState> {
    while (this.#state !== 'Finalized') {
      yield this.#state;
      if (
        this.#state === 'RequestedPlcOperation' &&
        !('confirmationToken' in this.#data)
      ) {
        return;
      }

      const config = stateMachineConfig[this.#state];
      try {
        // @ts-expect-error TypeScript can't know whether this.#data is a valid parameter.
        const result = await config(this.#data, this.#agents);
        this.#state = result.nextState;
        if ('agents' in result) {
          this.#agents = result.agents;
        }
        if ('data' in result) {
          this.#data = {
            ...this.#data,
            ...result.data,
          };
        }
      } catch (error) {
        throw new Error(`Migration failed during state "${this.#state}"`, {
          cause: error instanceof Error ? error : String(error),
        });
      }
    }

    await this.teardown();
    yield this.#state;
  }

  /**
   * Runs the migration state machine. Either runs to completion or stops and
   * returns the current state if the migration is not ready to proceed.
   *
   * Calls {@link teardown} if the migration is finalized.
   *
   * @returns The current state of the migration.
   */
  async run(): Promise<MigrationState> {
    await consume(this.runIter());
    return this.#state;
  }

  /**
   * Sets state to Finalized and logs out the agents, if any. Idempotent.
   */
  async teardown() {
    this.#state = 'Finalized';
    const agents = this.#agents;
    // Prevent re-entrancy
    this.#agents = undefined;
    if (agents) {
      await Promise.allSettled([
        agents.oldAgent.logout(),
        agents.newAgent.logout(),
      ]);
    }
  }
}
