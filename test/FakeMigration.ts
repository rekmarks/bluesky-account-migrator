import { MigrationState } from '../src/migration/index.js';
import type {
  AgentPair,
  Migration as ActualMigration,
  MigrationCredentials,
} from '../src/migration/index.js';
import type { PickPublic } from '../src/utils/misc.js';

export { MigrationState };

const mockAccountDid = 'did:plc:testuser123';

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
    return this.state;
  }

  async teardown(): Promise<void> {
    this.state = MigrationState.Finalized;
  }
}
