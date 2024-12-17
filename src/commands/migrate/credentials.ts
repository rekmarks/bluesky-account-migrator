import boxen from 'boxen';
import { bold, green } from 'yoctocolors-cjs';

import { confirm, input, password } from './prompts.js';
import type { MigrationCredentials } from '../../migration/index.js';
import { isHttpUrl, isValidHandle } from '../../utils/index.js';

export const validateUrl = (value: string) =>
  isHttpUrl(value) || 'Must be a valid HTTP or HTTPS URL string';

export const validateString = (value: string) =>
  value.length > 0 || 'Must be a non-empty string';

export const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value) || 'Must be a valid email address';

export const validateHandle = (value: string) =>
  isValidHandle(value) || 'Must be a valid handle';

export const stripHandlePrefix = (value: string) => value.replace(/^@/u, '');

/**
 * Validate the new handle, ensuring that it's a subdomain of the new PDS hostname.
 *
 * @param value - The new handle to validate.
 * @param newPdsHostname - The validated new PDS hostname.
 * @returns A string error message or `true` if the handle is valid.
 */
export const validateNewHandle = (
  value: string,
  newPdsHostname: string,
): string | true => {
  if (!isValidHandle(value)) {
    return 'Must be a valid handle';
  }

  return (
    value.endsWith(`.${newPdsHostname}`) ||
    'Must be a subdomain of the new PDS hostname'
  );
};

export async function getCredentialsInteractive(): Promise<
  MigrationCredentials | undefined
> {
  const oldPdsUrl = await input({
    message: 'Enter the current PDS URL',
    default: 'https://bsky.social',
    validate: validateUrl,
  });

  const oldHandle = await input({
    message:
      'Enter the full current handle (e.g. username.bsky.social, username.com)',
    validate: validateHandle,
  });

  const oldPassword = await password({
    message: 'Enter the password for the current account',
    validate: validateString,
  });

  const inviteCode = await input({
    message: 'Enter the invite code for the new account (from the new PDS)',
    validate: validateString,
  });

  const newPdsUrl = await input({
    message: 'Enter the new PDS URL',
    validate: validateUrl,
  });

  const newPdsHostname = new URL(newPdsUrl).hostname;

  const newHandle = await input({
    message: `Enter the desired new handle (e.g. username.${newPdsHostname})`,
    validate: (value) => validateNewHandle(value, newPdsHostname),
  });

  const newEmail = await input({
    message: 'Enter the desired email address for the new account',
    validate: validateEmail,
  });

  const newPassword = await password({
    message: 'Enter the desired password for the new account',
    validate: validateString,
  });
  await password({
    message: 'Confirm the password for the new account',
    validate: (value) => value === newPassword || 'Passwords do not match',
  });

  const credentials: MigrationCredentials = {
    oldPdsUrl,
    oldHandle,
    oldPassword,
    inviteCode,
    newPdsUrl,
    newHandle,
    newEmail,
    newPassword,
  };

  logCredentials(credentials);

  const confirmResult = confirm({
    message: 'Perform the migration with these credentials?',
  });

  if (!(await confirmResult)) {
    process.exitCode = 0;
    return undefined;
  }

  return credentials;
}

const credentialLabels = {
  oldPdsUrl: 'Current PDS URL',
  oldHandle: 'Current handle',
  oldPassword: 'Current password',
  inviteCode: 'Invite code',
  newPdsUrl: 'New PDS URL',
  newHandle: 'New handle',
  newEmail: 'New email',
  newPassword: 'New password',
} as const;

function logCredentials(credentials: MigrationCredentials) {
  const redacted = {
    ...credentials,
    oldPassword: '********',
    newPassword: '********',
  };

  const content = Object.entries(redacted)
    .map(([key, value]) => {
      return `${bold(`${credentialLabels[key as keyof MigrationCredentials]}:`)}\n${green(value)}`;
    })
    .join('\n');

  console.log();
  console.log(boxen(content, { title: bold('Credentials'), padding: 1 }));
  console.log();
}
