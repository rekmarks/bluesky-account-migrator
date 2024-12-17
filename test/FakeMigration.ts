import { MigrationStateSchema, stateUtils } from '../src/migration/index.js';
import type {
  AgentPair,
  Migration as ActualMigration,
  MigrationCredentials,
  SerializedMigration,
  MigrationState,
} from '../src/migration/index.js';
import type { PickPublic } from '../src/utils/misc.js';

const failureCondition = getFailureCondition();

const mockAccountDid = 'did:plc:testuser123';

export class Migration implements PickPublic<ActualMigration> {
  state: MigrationState = 'Ready';

  credentials: MigrationCredentials;

  accountDid = mockAccountDid;

  newPrivateKey = '0xdeadbeef';

  confirmationToken = '123456';

  agents = {
    oldAgent: {},
    newAgent: {},
    accountDid: mockAccountDid,
  } as unknown as AgentPair;

  constructor({ credentials }: { credentials: MigrationCredentials }) {
    this.credentials = credentials;
  }

  async run(): Promise<MigrationState> {
    if (this.state === 'Ready') {
      this.state = 'RequestedPlcOperation';
    } else {
      this.state = 'Finalized';
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
      confirmationToken: this.confirmationToken,
      newPrivateKey: this.newPrivateKey,
    };
    return data;
  }
}

function getFailureCondition() {
  // eslint-disable-next-line n/no-process-env
  const condition = process.env.FAILURE_CONDITION ?? undefined;
  if (condition !== undefined) {
    if (MigrationStateSchema.safeParse(condition).success) {
      return condition as MigrationState;
    }
    throw new Error(`Invalid failure condition: ${condition}`);
  }
  return undefined;
}
