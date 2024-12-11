import type { MigrationCredentials } from '../../migration/index.js';
import { isUrl } from '../../utils.js';
import { input, password } from './prompts.js';

export const validateUrl = (value: string) =>
  isUrl(value) || 'Must be a valid HTTP or HTTPS URL string';
export const validateString = (value: string) =>
  value.length > 0 || 'Must be a non-empty string';
export const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Must be a valid email address';

export async function getCredentialsInteractive(): Promise<MigrationCredentials> {
  const oldPdsUrl = await input({
    message: 'Enter the current PDS URL',
    default: 'https://bsky.social',
    validate: validateUrl,
  });
  const newPdsUrl = await input({
    message: 'Enter the new PDS URL',
    validate: validateUrl,
  });
  const oldHandle = await input({
    message: 'Enter the current handle',
    validate: validateString,
  });
  const newHandle = await input({
    message: 'Enter the desired new handle',
    validate: validateString,
  });
  const oldPassword = await password({
    message: 'Enter the password for the current account',
    validate: validateString,
  });
  const newPassword = await password({
    message: 'Enter the desired password for the new account',
    validate: validateString,
  });
  const newEmail = await input({
    message: 'Enter the desired email address for the new account',
    validate: validateEmail,
  });
  const inviteCode = await input({
    message:
      'Enter the invite code for the new account (from the destination PDS)',
    validate: validateString,
  });

  return {
    oldPdsUrl,
    newPdsUrl,
    oldHandle,
    oldPassword,
    newHandle,
    newEmail,
    newPassword,
    inviteCode,
  };
}
