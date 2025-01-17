import {
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
} from '../../src/migration/index.js';
import type { PickPublic } from '../../src/utils/misc.js';

const failureCondition = getFailureCondition();

const mockAccountDid = 'did:plc:testuser123';

const mockNewPrivateKey = '0xdeadbeef';

export class Migration implements PickPublic<ActualMigration> {
  state: MigrationState = 'Ready';

  credentials: MigrationCredentials;

  accountDid = mockAccountDid;

  newPrivateKey: string | undefined = mockNewPrivateKey;

  confirmationToken: string | undefined;

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

    return migration;
  }

  async run(): Promise<MigrationState> {
    if (this.state === 'Ready' && this.confirmationToken === undefined) {
      this.state = 'RequestedPlcOperation';
    } else {
      this.state = 'Finalized';
      if (this.newPrivateKey === undefined) {
        this.newPrivateKey = mockNewPrivateKey;
      }
    }
    this.#maybeFail();
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
