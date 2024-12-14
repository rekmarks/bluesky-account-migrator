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
  - If you're unsure what this means, you almost certainly have it.
- A PDS to migrate to
  - Ideally, this PDS has SMTP enabled in order to verify your email.
    Bluesky the app will ask you to do this for the new account.

### CLI

The CLI has a single command `migrate`, which you can run using e.g. `npx`:

```text
npx bluesky-account-migrator migrate
```

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
if (result !== MigrationState.RequestedPlcOperation) {
  // Something has gone extremely wrong if this happens
  throw new Error('unexpected migration state');
}

// You have to get this from the challenge email and make it available
// to your program somehow
const confirmationToken = '...';
migration.confirmationToken = confirmationToken;

result = await migration.run();
if (result !== MigrationState.Finalized) {
  // Again, something has gone extremely wrong if this happens
  throw new Error('unexpected migration state');
}

// This is the recovery private key for the account, which must be stored
// somewhere or risk the loss of the account
storeSomewhereSafe(migration.newPrivateKey);
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
