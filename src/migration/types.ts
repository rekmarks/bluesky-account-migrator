import type { AtpAgent } from '@atproto/api';

export type MigrationCredentials = {
  oldPdsUrl: string;
  newPdsUrl: string;
  oldHandle: string;
  oldPassword: string;
  newHandle: string;
  newEmail: string;
  newPassword: string;
  inviteCode: string;
};

export type AgentPair = {
  oldAgent: AtpAgent;
  newAgent: AtpAgent;
  accountDid: string;
};

export type PlcOperationParams = {
  token: string;
  rotationKeys: string[];
  alsoKnownAs?: string[];
  services?: Record<string, { type: string; endpoint: string }>;
};
