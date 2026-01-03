import boxen from 'boxen';
import { bold, green } from 'yoctocolors';

import { confirm, input, password } from './prompts.js';
import {
  isPdsSubdomain,
  makeMigrationCredentials,
  type MigrationCredentials,
} from '../../migration/index.js';
import {
  isEmail,
  isHttpUrl,
  isHandle,
  handleUnknownError,
  stringify,
  isPlainObject,
  normalizeUrl,
} from '../../utils/index.js';

/**
 * @param handle - The handle to extract the leaf domain from.
 * @returns The leaf domain of the handle.
 */
const extractLeafDomain = (handle: string) => handle.split('.').shift();

export const validateUrl = (value: string) =>
  isHttpUrl(normalizeUrl(value)) || 'Must be a valid URL';

export const validateString = (value: string) =>
  value.length > 0 || 'Must be a non-empty string';

export const validateEmail = (value: string) =>
  isEmail(value) || 'Must be a valid email address';

export const validateHandle = (value: string) =>
  isHandle(value) || 'Must be a valid handle';

export const validateTemporaryHandle = (
  newHandle: string,
  newPdsHostname: string,
) =>
  (isHandle(newHandle) && isPdsSubdomain(newHandle, newPdsHostname)) ||
  'Must be a valid handle and a subdomain of the new PDS hostname';

export const stripHandlePrefix = (value: string) => value.replace(/^@/u, '');

export const promptMessages = {
  oldPdsUrl: 'Enter the current PDS URL',
  oldHandle: 'Enter the full current handle (e.g. user.bsky.social, user.com)',
  oldPassword: 'Enter the password for the current account',
  inviteCode: 'Enter the invite code for the new account (from the new PDS)',
  newPdsUrl: 'Enter the new PDS URL',
  newHandle: (newPdsHostname: string) =>
    `Enter the desired new handle (e.g. user.${newPdsHostname})`,
  newTemporaryHandle:
    'You are using a custom handle. ' +
    'This requires a temporary handle that will be used during the migration.\n\n' +
    `Enter the desired temporary new handle`,
  newEmail: 'Enter the desired email address for the new account',
  newPassword: 'Enter the desired password for the new account',
  confirmPassword: 'Confirm the password for the new account',
} as const;

export async function getCredentialsInteractive(): Promise<
  MigrationCredentials | undefined
> {
  const oldPdsUrl = normalizeUrl(
    await input({
      message: promptMessages.oldPdsUrl,
      default: 'https://bsky.social',
      validate: validateUrl,
    }),
  );

  const oldHandle = await input({
    message: promptMessages.oldHandle,
    validate: validateHandle,
  });

  const oldPassword = await password({
    message: promptMessages.oldPassword,
    validate: validateString,
  });

  const inviteCode = await input({
    message: promptMessages.inviteCode,
    validate: validateString,
  });

  const newPdsUrl = normalizeUrl(
    await input({
      message: promptMessages.newPdsUrl,
      validate: validateUrl,
    }),
  );

  const newPdsHostname = new URL(newPdsUrl).hostname;

  const newHandle = await input({
    message: promptMessages.newHandle(newPdsHostname),
    validate: (value) => validateHandle(value),
  });

  let newTemporaryHandle: string | undefined;
  if (!isPdsSubdomain(newHandle, newPdsHostname)) {
    newTemporaryHandle = await input({
      message: promptMessages.newTemporaryHandle,
      validate: (value) => validateTemporaryHandle(value, newPdsHostname),
      default: `${extractLeafDomain(newHandle)}-temp.${newPdsHostname}`,
    });
  }

  const newEmail = await input({
    message: promptMessages.newEmail,
    validate: validateEmail,
  });

  const newPassword = await password({
    message: promptMessages.newPassword,
    validate: validateString,
  });
  await password({
    message: promptMessages.confirmPassword,
    validate: (value) => value === newPassword || 'Passwords do not match',
  });

  const rawCredentials: MigrationCredentials = {
    oldPdsUrl,
    oldHandle,
    oldPassword,
    inviteCode,
    newPdsUrl,
    newHandle: newTemporaryHandle
      ? {
          temporaryHandle: newTemporaryHandle,
          finalHandle: newHandle,
        }
      : { handle: newHandle },
    newEmail,
    newPassword,
  };

  let credentials: MigrationCredentials;
  try {
    credentials = makeMigrationCredentials(rawCredentials);
  } catch (error) {
    logCredentials(rawCredentials);
    throw handleUnknownError(
      `Fatal: Unexpected credential parsing error:\n${stringify(rawCredentials)}`,
      error,
    );
  }

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
  newEmail: 'New email',
  newPassword: 'New password',
} as const;

function logCredentials(credentials: MigrationCredentials) {
  const redacted = {
    ...credentials,
    oldPassword: '********',
    newPassword: '********',
  };

  const getStringValue = (key: string, value: string) =>
    `${bold(`${key}:`)}\n${green(value)}`;

  const content = Object.entries(redacted)
    .map(([key, value]) => {
      if (isPlainObject(value)) {
        if ('handle' in value) {
          return getStringValue('New handle', value.handle);
        }
        return `${getStringValue('New handle (temporary)', value.temporaryHandle)}\n${getStringValue('New handle (final)', value.finalHandle)}`;
      }
      return getStringValue(
        // @ts-expect-error
        credentialLabels[key],
        value,
      );
    })
    .join('\n');

  console.log();
  console.log(boxen(content, { title: bold('Credentials'), padding: 1 }));
  console.log();
}
