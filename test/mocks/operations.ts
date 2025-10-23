import type {
  AgentPair,
  MigrationCredentials,
  MigrationState,
} from '../../src/migration/types.js';
import { makeMockAccountStatuses } from '../utils.js';

export type MockOperationPlan = {
  failureState?: MigrationState;
  newPrivateKey?: string;
};

const envPlan = process.env.MOCK_OPERATIONS_PLAN;
if (!envPlan) {
  throw new Error('MOCK_OPERATIONS_PLAN environment variable is not set');
}
const plan: MockOperationPlan = JSON.parse(envPlan);

const makeMockAgent = () => {
  return {
    login: async () => undefined,
    logout: async () => undefined,
  };
};

const failIfPlanned = (currentState: MigrationState) => {
  if (plan.failureState === currentState) {
    throw new Error(`Planned failure during state "${currentState}"`);
  }
};

export const initializeAgents = async (_args: {
  credentials: MigrationCredentials;
}) => {
  failIfPlanned('Ready');
  const agents = {
    oldAgent: makeMockAgent(),
    newAgent: makeMockAgent(),
    accountDid: 'did:plc:testuser123',
  } as unknown as AgentPair;
  return agents;
};

export const createNewAccount = async () => {
  failIfPlanned('Initialized');
};

export const migrateData = async () => {
  failIfPlanned('CreatedNewAccount');
};

export const requestPlcOperation = async () => {
  failIfPlanned('MigratedData');
};

export const migrateIdentity = async () => {
  failIfPlanned('RequestedPlcOperation');
  return plan.newPrivateKey;
};

export const checkAccountStatus = async () => {
  failIfPlanned('MigratedIdentity');
  return {
    accountStatuses: makeMockAccountStatuses(),
  };
};

export const finalize = async () => {
  failIfPlanned('CheckedAccountStatus');
};
