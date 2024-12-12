import { Migration, MigrationState } from '../../migration/index.js';
import { getCredentialsInteractive, validateString } from './credentials.js';
import { input } from './prompts.js';

export async function handleMigrateInteractive(): Promise<void> {
  console.log('🦋 Welcome to the Bluesky account migration tool 🦋');
  console.log();
  console.log('---- ⚠️ ----');
  console.log(
    'This is a community-maintained tool that has no affiliation with Bluesky. ' +
      'Use at your own risk.',
  );
  console.log();
  console.log(
    'At the end of the migration process, ' +
      'this tool will print the private key of the new account to the console.',
  );
  console.log(
    'You MUST save this key in a secure location, ' +
      'or you could lose access to your account.',
  );
  console.log('---- ⚠️ ----');
  console.log();

  const credentials = await getCredentialsInteractive();
  const migration = new Migration({ credentials });
  let result = await migration.run();
  if (result !== MigrationState.RequestedPlcOperation) {
    throw new Error(
      `Fatal: Unexpected migration state "${result}" after initial run. Please report this bug.`,
    );
  }

  console.log();
  console.log(
    `Email challenge requested from old PDS (${credentials.oldPdsUrl}).`,
  );
  console.log(
    `An email should have been sent to the old account's email address.`,
  );
  console.log();

  const confirmationToken = await input({
    message: 'Enter the confirmation token from the challenge email',
    validate: validateString,
  });
  migration.confirmationToken = confirmationToken;
  result = await migration.run();
  if (result !== MigrationState.Finalized) {
    throw new Error(
      `Fatal: Unexpected migration state "${result}" after resuming migration. Please report this bug.`,
    );
  }
  if (!migration.newPrivateKey) {
    throw new Error(
      `Fatal: No private key found after migration. Please report this bug.`,
    );
  }

  console.log();
  console.log(`Migration completed successfully!`);
  console.log(`Your private key is:\n${migration.newPrivateKey}\n`);
  console.log(
    `Please save this key in a secure location, or you could lose access to your account.`,
  );
  console.log();
  console.log(`Thank you for using the Bluesky account migration tool 🙇`);
}
