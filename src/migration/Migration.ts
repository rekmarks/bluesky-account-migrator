import * as operations from './operations/index.js';
import { AgentPair, MigrationCredentials } from './types.js';

export enum MigrationState {
  Ready,
  Initialized,
  NewAccount,
  MigratedData,
  MigratedIdentity,
  Finalized,
}

export const MigrationStateNames = Object.freeze(Object.values(MigrationState));

const stringify = (value: unknown) => JSON.stringify(value, null, 2);

const isObject = (
  value: unknown,
): value is Record<string | number | symbol, unknown> =>
  typeof value === 'object' && value !== null;

type TransitionParams = {
  [MigrationState.Ready]: [MigrationCredentials];
  [MigrationState.Initialized]: [AgentPair, MigrationCredentials];
  [MigrationState.NewAccount]: [AgentPair];
  [MigrationState.MigratedData]: [AgentPair, string];
  [MigrationState.MigratedIdentity]: [AgentPair];
  [MigrationState.Finalized]: never;
};

type TransitionResults = {
  [MigrationState.Ready]: AgentPair;
  [MigrationState.Initialized]: void;
  [MigrationState.NewAccount]: void;
  [MigrationState.MigratedData]: string;
  [MigrationState.MigratedIdentity]: void;
  [MigrationState.Finalized]: void;
};

export const transitionMap = Object.freeze({
  [MigrationState.Ready]: operations.initializeAgents,
  [MigrationState.Initialized]: operations.createNewAccount,
  [MigrationState.NewAccount]: operations.migrateData,
  [MigrationState.MigratedData]: operations.migrateIdentity,
  [MigrationState.MigratedIdentity]: operations.finalizeMigration,
  [MigrationState.Finalized]: () => Promise.resolve(),
}) satisfies {
  [K in MigrationState]: (
    ...params: TransitionParams[K]
  ) => Promise<TransitionResults[K]>;
};

export type TransitionMap = typeof transitionMap;

type MigrationParams = {
  credentials: MigrationCredentials;
  agents?: AgentPair;
  confirmationToken?: string;
};

/**
 * A simple state machine for migrating an account from one agent to another.
 *
 * @example
 * ```ts
 * const migration = new Migration({
 *   credentials: ...,
 *   confirmationToken: ...,
 * });
 * await migration.run(); // Will run until the migration is complete
 * ```
 *
 * @example
 * ```ts
 * const migration = new Migration({ credentials: ... }); // No confirmation token
 * await migration.run(); // Will run until needing a confirmation token
 * migration.setConfirmationToken('...'); // Set the confirmation token
 * await migration.run(); // Will run until the migration is complete
 * ```
 */
export class Migration {
  #state: MigrationState;
  readonly #transitions: typeof transitionMap;
  readonly #params: MigrationParams;
  #toAccountPrivateKey?: string;

  get accountDid() {
    return this.#params.agents?.accountDid;
  }

  get toAccountPrivateKey() {
    return this.#toAccountPrivateKey;
  }

  constructor(
    params: MigrationParams,
    state: MigrationState = MigrationState.Ready,
    transitions = transitionMap,
  ) {
    this.#state = state;
    this.#params = params;
    this.#transitions = transitions;
  }

  setAgents(agents: AgentPair) {
    this.#params.agents = agents;
  }

  setConfirmationToken(token: string) {
    this.#params.confirmationToken = token;
  }

  async run(): Promise<MigrationState> {
    while (this.#state !== MigrationState.Finalized) {
      if (
        this.#state === MigrationState.MigratedData &&
        !this.#params.confirmationToken
      ) {
        break;
      }
      await this.#next();
    }
    return this.#state;
  }

  async #next(): Promise<MigrationState> {
    if (this.#state !== MigrationState.Finalized) {
      const params = this.#getTransitionParams();
      // @ts-expect-error TypeScript doesn't know how to spread a union of tuples here.
      const result = await this.#transitions[this.#state](...params);
      this.#handleResult(result);
      this.#state = this.#state + 1;
    }
    return this.#state;
  }

  #getTransitionParams(): TransitionParams[MigrationState] {
    const fail = (message: string): never =>
      this.#fail(`Unable to perform next transition: ${message}`);

    switch (this.#state) {
      case MigrationState.Ready:
        return [this.#params.credentials];

      case MigrationState.Initialized:
        if (!this.#params.agents) {
          return fail('Missing "agents"');
        }
        return [this.#params.agents, this.#params.credentials];

      case MigrationState.NewAccount:
      case MigrationState.MigratedIdentity:
        if (!this.#params.agents) {
          return fail('Missing "agents"');
        }
        return [this.#params.agents];

      case MigrationState.MigratedData:
        if (!this.#params.agents || !this.#params.confirmationToken) {
          return fail('Missing "agents" or "confirmationToken"');
        }
        return [this.#params.agents, this.#params.confirmationToken];

      case MigrationState.Finalized:
        // This should never happen
        throw new Error('Cannot transition from Finalized state');

      default:
        // @ts-expect-error Exhaustiveness check
        throw new Error(`Invalid state: ${this.#state.valueOf()}`);
    }
  }

  #handleResult(result: TransitionResults[MigrationState]): void {
    const fail = (result: unknown) =>
      this.#fail(
        `Transition returned invalid result of type "${typeof result}": ${stringify(result)}`,
      );

    switch (this.#state) {
      case MigrationState.Ready:
        if (!isObject(result) || !('accountDid' in result)) {
          return fail(result);
        }
        this.#params.agents = result;
        break;

      case MigrationState.MigratedData:
        if (typeof result !== 'string') {
          return fail(result);
        }
        this.#toAccountPrivateKey = result;
        break;

      case MigrationState.Initialized:
      case MigrationState.NewAccount:
      case MigrationState.MigratedIdentity:
      case MigrationState.Finalized:
        if (result !== undefined) {
          return fail(result);
        }
        break;

      default:
        // @ts-expect-error Exhaustiveness check
        throw new Error(`Invalid state: ${this.#state.valueOf()}`);
    }
  }

  #fail(message: string): never {
    throw new Error(
      `Migration failed during "${this.#state}: ${MigrationStateNames[this.#state]}": ${message}`,
    );
  }
}
