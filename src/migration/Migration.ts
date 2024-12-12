import { isObject, stringify } from '../utils.js';
import * as operations from './operations/index.js';
import type { AgentPair, MigrationCredentials } from './types.js';

export enum MigrationState {
  Ready = 'Ready',
  Initialized = 'Initialized',
  NewAccount = 'NewAccount',
  MigratedData = 'MigratedData',
  MigratedIdentity = 'MigratedIdentity',
  Finalized = 'Finalized',
}

type ReadyStateData = {
  credentials: MigrationCredentials;
  agents?: AgentPair;
  confirmationToken?: string;
};

type InitializedStateData = ReadyStateData & {
  agents: AgentPair;
};

type MigratedIdentityStateData = InitializedStateData & {
  confirmationToken: string;
  newPrivateKey: string;
};

type StateData = {
  [MigrationState.Ready]: ReadyStateData;
  [MigrationState.Initialized]: InitializedStateData;
  [MigrationState.NewAccount]: InitializedStateData;
  [MigrationState.MigratedData]: InitializedStateData;
  [MigrationState.MigratedIdentity]: MigratedIdentityStateData;
  [MigrationState.Finalized]: MigratedIdentityStateData;
};

type TransitionResult<S extends MigrationState> = Promise<{
  nextState: MigrationState;
  data?: StateData[S];
}>;

type StateMachineConfig = {
  [S in MigrationState]: (data: StateData[S]) => TransitionResult<S>;
};

const stateMachineConfig: StateMachineConfig = {
  [MigrationState.Ready]: async ({ credentials }) => {
    const agents = await operations.initializeAgents({ credentials });
    return {
      nextState: MigrationState.Initialized,
      data: { credentials, agents },
    };
  },
  [MigrationState.Initialized]: async ({ credentials, agents }) => {
    await operations.createNewAccount({ agents, credentials });
    return {
      nextState: MigrationState.NewAccount,
    };
  },
  [MigrationState.NewAccount]: async ({ agents }) => {
    await operations.migrateData(agents);
    return {
      nextState: MigrationState.MigratedData,
    };
  },
  [MigrationState.MigratedData]: async (params) => {
    const { agents, credentials, confirmationToken } = params;
    if (!confirmationToken) {
      return {
        nextState: MigrationState.MigratedData,
      };
    }

    const newPrivateKey = await operations.migrateIdentity(
      agents,
      confirmationToken,
    );
    return {
      nextState: MigrationState.MigratedIdentity,
      data: { credentials, agents, confirmationToken, newPrivateKey },
    };
  },
  [MigrationState.MigratedIdentity]: async ({ agents }) => {
    await operations.finalizeMigration(agents);
    return {
      nextState: MigrationState.Finalized,
    };
  },
  [MigrationState.Finalized]: async (_data) => {
    throw new Error('Cannot transition from Finalized state');
  },
};

export class Migration {
  #state: MigrationState;
  #data: StateData[MigrationState];

  constructor(
    initialData: ReadyStateData,
    initialState: MigrationState = MigrationState.Ready,
  ) {
    this.#state = initialState;
    this.#data = initialData;
  }

  get accountDid() {
    return 'agents' in this.#data ? this.#data.agents.accountDid : undefined;
  }

  get newPrivateKey() {
    return 'newPrivateKey' in this.#data ? this.#data.newPrivateKey : undefined;
  }

  set agents(agents: AgentPair) {
    this.#data = { ...this.#data, agents };
  }

  set confirmationToken(token: string) {
    this.#data = { ...this.#data, confirmationToken: token };
  }

  async run(): Promise<MigrationState> {
    while (this.#state !== MigrationState.Finalized) {
      if (
        this.#state === MigrationState.MigratedData &&
        !('confirmationToken' in this.#data)
      ) {
        break;
      }

      const config = stateMachineConfig[this.#state];
      // @ts-expect-error TypeScript can't know whether this.#data is a valid parameter.
      const result = await config(this.#data);
      this.#state = result.nextState;
      if (result.data !== undefined) {
        this.#data = {
          ...this.#data,
          ...result.data,
        };
      }
    }
    return this.#state;
  }
}
