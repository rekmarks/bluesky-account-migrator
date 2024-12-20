# bluesky-account-migrator

A Node.js CLI for migrating Bluesky accounts from one PDS to another.

> [!WARNING]
> This is community-maintained software. It has no affiliation with Bluesky the company.
> Use at your own risk.
>
> `bluesky-account-migrator` is currently in a beta state. If a migration fails, you will
> have to figure out how to recover on your own. See [troubleshooting](#troubleshooting)
> for more details.

## Installation

```text
# In a package
npm install bluesky-account-migrator

# Globally
npm install -g bluesky-account-migrator
```

Or the equivalent incantation using your package manager of choice.

## Usage

Migrating your Bluesky account is a potentially destructive operation that can result in
losing access to the account. This CLI files away some of the rough edges, but it's far
from perfect, and can't help you recover if the migration fails (although you may be able
to do so yourself, see [troubleshooting](#troubleshooting)).

To get a better understanding of the risks and steps involved in account migration, see
[Bluesky's account migration guide](https://github.com/bluesky-social/pds/blob/9ac9461ce2e4ed7ac66889bb1017662a2f846c98/ACCOUNT_MIGRATION.md). The implementation
of this package is based on the snippet in that guide.

### Requirements

- A `did:plc` Bluesky account
  - If don't know what this means, you're almost certainly fine.
- A PDS to migrate to
  - Ideally, this PDS has SMTP enabled in order to verify your email.
    Bluesky the app will ask you to do this for the new account.

### Gotchas

#### Custom handles

You cannot submit custom handles—i.e. ones that do not end with `.bsky.social`—
as your new handle.
Bluesky's PDS implementation requires that all handles are a subdomain of the PDS
hostname.
For example, if your PDS is hosted at `pds.foo.com`, new accounts must have handles
of the form `*.pds.foo.com`.
If you already have a custom handle, you can configure it for your migrated account
after the migration.
See e.g. [this discussion](https://github.com/bluesky-social/atproto/discussions/2909)
for how to do this.

### CLI

The CLI has a single command `migrate`, which you can run using e.g. `npx`:

```text
npx bluesky-account-migrator migrate [--mode <mode>]
```

The CLI has two modes.

#### `interactive`

This will interactively walk you through migrating your Bluesky account from one PDS to
another. It will collect most of the necessary information upfront, such as the PDS URLs,
account handles, etc., then ask if you want to start the migration:

```text
? Perform the migration with these credentials? (Y/n)
```

Migrating your account requires completing an email challenge. Assuming all goes well,
the migration will run until the challenge email has been sent. You will have to retrieve
the confirmation token in this email and provide it to the CLI to complete the migration:

```text
An email should have been sent to the old account's email address.

? Enter the confirmation token from the challenge email
```

If the challenge token is correct, the migration should complete successfully.
At the end of the migration, the private recovery key will be printed to the terminal.
You must save this key in a secure location, or you could lose access to your account.

#### `pipe`

This causes the CLI to read from `stdin` and write to `stdout`. It will only output
the results of running the migraiton to `stdout`, and any errors or other logs will
be written to `stderr`.

Given a file `credentials.json` with the following contents:

```json
{
  "credentials": {
    "oldPdsUrl": "https://old.bsky.social",
    "newPdsUrl": "https://new.bsky.social",
    "oldHandle": "old.handle.com",
    "oldPassword": "oldpass123",
    "newHandle": "new.handle.com",
    "newEmail": "new@email.com",
    "newPassword": "newpass123",
    "inviteCode": "invite-123"
  }
}
```

The CLI can then be invoked as follows:

```bash
cat credentials.json | npx bluesky-account-migrator --mode pipe > result.json
```

If the credentials are correct, `result.json` should look like this:

```json
{
  "state": "RequestedPlcOperation",
  "credentials": {
    "oldPdsUrl": "https://old.bsky.social",
    "newPdsUrl": "https://new.bsky.social",
    "oldHandle": "old.handle.com",
    "oldPassword": "oldpass123",
    "newHandle": "new.handle.com",
    "newEmail": "new@email.com",
    "newPassword": "newpass123",
    "inviteCode": "invite-123"
  }
}
```

In this state, the migration should have dispatched a challenge email to the email
associated with the account on the old PDS. Once you have retrieved the confirmation
token from the email, you can complete the migration like so:

```bash
cat result.json | \
  jq '. + {"confirmationToken": "<Token>"}' | \
  npx bluesky-account-migrator migrate --mode pipe > \
  finalResult.json
```

If the confirmation token is correct, `finalResult.json` should look like this:

```json
{
  "state": "Finalized",
  "credentials": {
    "oldPdsUrl": "https://old.bsky.social",
    "newPdsUrl": "https://new.bsky.social",
    "oldHandle": "old.handle.com",
    "oldPassword": "oldpass123",
    "newHandle": "new.handle.com",
    "newEmail": "new@email.com",
    "newPassword": "newpass123",
    "inviteCode": "invite-123"
  },
  "confirmationToken": "<Token>",
  "newPrivateKey": "<PrivateKey>"
}
```

> [!IMPORTANT]
> If the migration fails the CLI will exit with a non-zero error code, but the result
> will still be written to `stdout`. This enables retrieving the generated private key,
> if any.
>
> To retrieve the migration output, you **must** ensure that your script handles failures
> appropriately. For example, you cannot naively use `set -e` in Bash, since that would
> prevent capturing the output on failure.
> Instead, capture the output and check the exit code separately:
>
> ```bash
> output=$(cat result.json | npx bluesky-account-migrator migrate --mode pipe)
> exit_code=$?
>
> if [ $exit_code -ne 0 ]; then
>   echo "Migration failed with exit code $exit_code" >&2
>   echo "Output was:" >&2
>   echo "$output" >&2
>   exit $exit_code
> fi
>
> echo "$output" > finalResult.json
> ```

### API

The migration is implemented as a state machine in the form of the `Migration` class.
You can run a migration programmatically as follows:

```ts
import { Migration, MigrationState } from 'bluesky-account-migrator';

const credentials = {
  oldPdsUrl: 'https://old.bsky.social',
  oldHandle: 'old.handle.com',
  oldPassword: 'oldpass123',
  inviteCode: 'invite-123',
  newPdsUrl: 'https://new.bsky.social',
  newHandle: 'new.handle.com',
  newEmail: 'new@email.com',
  newPassword: 'newpass123',
};

const migration = new Migration({ credentials });

let result = await migration.run();
if (result !== 'RequestedPlcOperation') {
  // Something has gone extremely wrong if this happens
  throw new Error('unexpected migration state');
}

// You have to get this from the challenge email and make it available
// to your program somehow
const confirmationToken = '...';
migration.confirmationToken = confirmationToken;

result = await migration.run();
if (result !== 'Finalized') {
  // Again, something has gone extremely wrong if this happens
  throw new Error('unexpected migration state');
}

// This is the recovery private key for the account, which must be stored
// somewhere or risk the loss of the account
storeSomewhereSafe(migration.newPrivateKey);
```

If you need to persist an unfinished migration, e.g. on failure or when getting
the confirmation token, you can use the `serialize()`/`deserialize()` methods:

```ts
const migration = new Migration({ credentials });
await migration.run();

// NOTE: This will output the user's passwords and private key in plaintext,
// if present.
const serialized = migration.serialize();
saveMigration(JSON.stringify(serialized, null, 2));

// Later
const savedMigration = loadMigration();
const migration = Migration.deserialize(JSON.parse(savedMigration));
migration.confirmationToken = confirmationToken;
await migration.run();
```

### Troubleshooting

> [!IMPORTANT]
> If you encounter any problems with `bluesky-account-migrator`, please
> [file an issue](https://github.com/rekmarks/bluesky-account-migrator/issues/new).

#### Migration failure

If your migration fails, you are alone in strange territory. However, all is not lost.
While `bluesky-account-migrator` is not (yet) equipped to resume partial migrations,
the error should tell you where it failed. In addition, the migration is implemented
as a state machine, and you should be able to figure out what's left to do by consulting
[this file](./src/migration/Migration.ts). In brief, each state maps to an "operation",
which is essentially a function wrapping a set of logically associated API calls. By
identifying the error and the remaining API calls, you can likely compose a script that
completes the rest of the migration.

#### Other issues

- Missing data / blobs
  - It may be the case that your migrated account is missing data / blobs.
  - You can verify this manually using `com.atproto.server.checkAccountStatus`.
  - Finding missing data is currently out of scope for this CLI.
