import { getCredentialsInteractive, validateString } from './credentials.js';
import { input, pressEnter } from './prompts.js';
import { Migration } from '../../migration/index.js';
import type {
  MigrationCredentials,
  MigrationState,
} from '../../migration/index.js';
import {
  logError,
  logDelimiter,
  logWarning,
  logWelcome,
  logCentered,
  logWrapped,
  makeSpinner,
} from '../../utils/index.js';

const spinner = makeSpinner();

/**
 * Handles the interactive migration mode.
 */
export async function handleInteractive(): Promise<void> {
  logIntroduction();

  const { credentials, migration } = (await initializeMigration()) ?? {};
  if (!credentials || !migration) {
    return;
  }

  try {
    const privateKey = await executeMigration(credentials, migration);
    await handleSuccess(privateKey);
  } catch (error) {
    spinner.stop();
    await handleFailure(migration);
    throw error;
  }
}

/**
 * Logs the introductory messages to the user.
 */
function logIntroduction(): void {
  logWelcome();
  console.log();
  logWarning(`
    This is a community-maintained tool that has no affiliation with Bluesky.
    Use at your own risk.


    At the end of the migration process, this tool will print the private key of the new account to the console.

    You must save this key in a secure location, or you could lose access to your account.
  `);
  console.log();
}

/**
 * Collects credentials from the user and constructs the new Migration instance.
 *
 * @returns if successful,
 * undefined if the user cancels the process
 */
async function initializeMigration(): Promise<
  | {
      credentials: MigrationCredentials;
      migration: Migration;
    }
  | undefined
> {
  const credentials = await getCredentialsInteractive();
  if (!credentials) {
    return undefined;
  }

  return { credentials, migration: new Migration({ credentials }) };
}

/**
 * Given a fresh migration instance, runs the migration until it reaches the `Finalized` state.
 *
 * @param credentials - The credentials for the migration.
 * @param migration - The migration instance.
 * @returns The private key of the new account.
 * @throws {Error} if anything goes wrong.
 */
async function executeMigration(
  credentials: MigrationCredentials,
  migration: Migration,
): Promise<string> {
  await beginMigration(migration);

  // eslint-disable-next-line require-atomic-updates
  migration.confirmationToken = await promptForConfirmationToken(credentials);

  return await finalizeMigration(migration);
}

/**
 * Runs the migration until it reaches the `RequestedPlcOperation` state.
 *
 * @param migration - The migration instance.
 * @throws {Error} if the resulting migration state is not as expected
 */
async function beginMigration(migration: Migration): Promise<void> {
  spinner.start();
  let result: MigrationState | undefined;
  for await (const state of migration.runIter()) {
    if (state !== 'RequestedPlcOperation') {
      spinner.text = getLoadingMessage(state);
    }
    result = state;
  }
  spinner.stop();

  if (result !== 'RequestedPlcOperation') {
    throw new Error(
      `Fatal: Unexpected migration state "${result}" after initial run. Please report this bug.`,
    );
  }
}

/**
 * Requests a confirmation token from the user.
 *
 * @param credentials - The credentials for the migration.
 * @returns The confirmation token.
 * @throws {Error} if the user cancels the process
 */
async function promptForConfirmationToken(
  credentials: MigrationCredentials,
): Promise<string> {
  console.log();
  logWrapped(
    `Email challenge requested from old PDS (${credentials.oldPdsUrl}).`,
  );
  logWrapped(
    `An email should have been sent to the old account's email address.`,
  );
  console.log();

  return await input({
    message: 'Enter the confirmation token from the challenge email',
    validate: validateString,
  });
}

/**
 * Runs the migration until it reaches the `Finalized` state.
 *
 * @param migration - The migration instance.
 * @returns The private key of the new account.
 * @throws {Error} if the resulting migration state is not as expected
 */
async function finalizeMigration(migration: Migration): Promise<string> {
  spinner.start();
  let result: MigrationState | undefined;
  for await (const state of migration.runIter()) {
    if (state !== 'Finalized') {
      spinner.text = getLoadingMessage(state);
    }
    result = state;
  }
  spinner.stop();

  if (result !== 'Finalized') {
    throw new Error(
      `Fatal: Unexpected migration state "${result}" after resuming migration. Please report this bug.`,
    );
  }
  if (!migration.newPrivateKey) {
    throw new Error(
      `Fatal: No private key found after migration. Please report this bug.`,
    );
  }

  return migration.newPrivateKey;
}

async function handleSuccess(privateKey: string): Promise<void> {
  console.log();
  logCentered('Migration completed successfully! ✅');
  console.log();
  logWarning(
    `You must save the private key in a secure location, or you could lose access to your account.`,
  );
  console.log();
  await logPrivateKey(privateKey);
  console.log();
  logCentered('Thank you for using the Bluesky account migration tool 🙇');
}

async function handleFailure(migration: Migration): Promise<void> {
  console.log();
  logError(`Migration failed during state "${migration.state}"`);
  if (migration.state !== 'Ready') {
    console.log();
    logError(
      'The migration has created a new account, but it may not be ready to use yet.',
    );
  }

  if (migration.newPrivateKey) {
    console.log();
    logError('You should still save the private key in a secure location.');
    console.log();
    await logPrivateKey(migration.newPrivateKey);
    await pressEnter();
  }
}

async function logPrivateKey(privateKey: string): Promise<void> {
  await pressEnter("Press Enter to view the new account's private key...");
  console.log();
  logWrapped(`The new account's private key is:`);
  logDelimiter('=');
  console.log();
  console.log(privateKey);
  console.log();
  logDelimiter('=');
  console.log();
}

function getLoadingMessage(state: MigrationState) {
  switch (state) {
    case 'Ready':
      return 'Initializing migration...';
    case 'Initialized':
      return 'Creating new account...';
    case 'CreatedNewAccount':
      return 'Migrating data... (this may take a while)';
    case 'MigratedData':
      return 'Requesting PLC operation...';
    case 'RequestedPlcOperation':
      return 'Migrating identity...';
    case 'MigratedIdentity':
      return 'Finalizing migration...';
    case 'Finalized':
    default:
      return '';
  }
}
