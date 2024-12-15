import { MigrationState } from '../src/migration/index.js';
import type {
  AgentPair,
  Migration as ActualMigration,
  MigrationCredentials,
} from '../src/migration/index.js';
import type { PickPublic } from '../src/utils/misc.js';

export { MigrationState };

const failureCondition = getFailureCondition();

const mockAccountDid = 'did:plc:testuser123';

const getStateIndex = (state: MigrationState) =>
  Object.values(MigrationState).indexOf(state);

export class Migration implements PickPublic<ActualMigration> {
  state: MigrationState = MigrationState.Ready;

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
    if (this.state === MigrationState.Ready) {
      this.state = MigrationState.RequestedPlcOperation;
    } else {
      this.state = MigrationState.Finalized;
    }
    this.#maybeFail();
    return this.state;
  }

  #maybeFail() {
    if (failureCondition) {
      if (getStateIndex(this.state) >= getStateIndex(failureCondition)) {
        this.state = failureCondition;
        throw new Error(`Migration failed during state "${this.state}"`);
      }
    }
  }

  async teardown(): Promise<void> {
    this.state = MigrationState.Finalized;
  }
}

function getFailureCondition() {
  // eslint-disable-next-line n/no-process-env
  const condition = process.env.FAILURE_CONDITION ?? undefined;
  if (condition) {
    if (condition in MigrationState) {
      return condition as MigrationState;
    }
    throw new Error(`Invalid failure condition: ${condition}`);
  }
  return undefined;
}
