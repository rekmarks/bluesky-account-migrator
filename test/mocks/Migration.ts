import {
  migrationStateValues,
  MigrationStateSchema,
  SerializedMigrationSchema,
  stateUtils,
} from '../../src/migration/index.js';
import type {
  AgentPair,
  MigrationCredentials,
  SerializedMigration,
  MigrationState,
  Migration as ActualMigration,
  AccountStatuses,
} from '../../src/migration/index.js';
import { consume } from '../../src/utils/misc.js';
import type { PickPublic } from '../utils.js';

const failureCondition = getFailureCondition();

const mockAccountDid = 'did:plc:testuser123';

const mockNewPrivateKey = '0xdeadbeef';

export class Migration implements PickPublic<ActualMigration> {
  state: MigrationState = 'Ready';

  stateIndex = 0;

  credentials: MigrationCredentials;

  accountDid = mockAccountDid;

  newPrivateKey: string | undefined = mockNewPrivateKey;

  confirmationToken: string | undefined;

  accountStatuses: AccountStatuses | undefined;

  agents = {
    oldAgent: {},
    newAgent: {},
    accountDid: mockAccountDid,
  } as unknown as AgentPair;

  constructor({ credentials }: { credentials: MigrationCredentials }) {
    this.credentials = credentials;
  }

  static async deserialize(data: SerializedMigration): Promise<Migration> {
    const parsed = SerializedMigrationSchema.parse(data);

    const migration = new Migration(parsed);
    migration.state = parsed.state;
    migration.confirmationToken =
      'confirmationToken' in parsed ? parsed.confirmationToken : undefined;
    migration.newPrivateKey =
      'newPrivateKey' in parsed ? parsed.newPrivateKey : undefined;
    migration.accountStatuses =
      'accountStatuses' in parsed ? parsed.accountStatuses : undefined;

    return migration;
  }

  async *runIter(): AsyncGenerator<MigrationState> {
    while (this.state !== 'Finalized') {
      yield this.state;
      if (
        this.state === 'RequestedPlcOperation' &&
        this.confirmationToken === undefined
      ) {
        return;
      }
      this.stateIndex++;
      this.state = migrationStateValues[this.stateIndex] as MigrationState;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (this.state === 'Finalized' && this.newPrivateKey === undefined) {
      this.newPrivateKey = mockNewPrivateKey;
    }
    this.#maybeFail();
    yield this.state;
  }

  async run(): Promise<MigrationState> {
    await consume(this.runIter());
    return this.state;
  }

  #maybeFail() {
    if (failureCondition) {
      if (stateUtils.gte(this.state, failureCondition)) {
        this.state = failureCondition;
        throw new Error(`Migration failed during state "${this.state}"`);
      }
    }
  }

  async teardown(): Promise<void> {
    this.state = 'Finalized';
  }

  serialize(): SerializedMigration {
    const data: SerializedMigration = {
      state: this.state,
      credentials: this.credentials,
      accountStatuses: this.accountStatuses,
      // Lie about these
      confirmationToken: this.confirmationToken as string,
      newPrivateKey: this.newPrivateKey as string,
    };
    // Strip undefined values
    return JSON.parse(JSON.stringify(data));
  }
}

function getFailureCondition() {
  const condition = process.env.FAILURE_CONDITION ?? undefined;
  if (condition !== undefined) {
    if (MigrationStateSchema.safeParse(condition).success) {
      return condition as MigrationState;
    }
    throw new Error(`Invalid failure condition: ${condition}`);
  }
  return undefined;
}
