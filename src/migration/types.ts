import type { AtpAgent } from '@atproto/api';

export type MigrationCredentials = {
  fromPdsUrl: string;
  toPdsUrl: string;
  fromHandle: string;
  fromPassword: string;
  toHandle: string;
  toEmail: string;
  toPassword: string;
  inviteCode: string;
};

export type AgentPair = {
  fromAgent: AtpAgent;
  toAgent: AtpAgent;
  accountDid: string;
};

export type PlcOperationParams = {
  token: string;
  rotationKeys: string[];
  alsoKnownAs?: string[];
  services?: Record<string, { type: string; endpoint: string }>;
};
