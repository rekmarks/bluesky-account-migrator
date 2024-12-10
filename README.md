# bluesky-account-migrator

A simple CLI for migrating Bluesky accounts from one PDS to another.

## Migration template

Suggested account migration flow from
[bluesky-social/pds](https://github.com/bluesky-social/pds/blob/9ac9461ce2e4ed7ac66889bb1017662a2f846c98/ACCOUNT_MIGRATION.md).

```ts
//
import AtpAgent from '@atproto/api';
import { Secp256k1Keypair } from '@atproto/crypto';
import * as ui8 from 'uint8arrays';

const OLD_PDS_URL = 'https://bsky.social';
const NEW_PDS_URL = 'https://example.com';
const CURRENT_HANDLE = 'to-migrate.bsky.social';
const CURRENT_PASSWORD = 'password';
const NEW_HANDLE = 'migrated.example.com';
const NEW_ACCOUNT_EMAIL = 'migrated@example.com';
const NEW_ACCOUNT_PASSWORD = 'password';
const NEW_PDS_INVITE_CODE = 'example-com-12345-abcde';

const migrateAccount = async () => {
  // Long-lived, stateful, should probably carry over
  const oldAgent = new AtpAgent({ service: OLD_PDS_URL });
  const newAgent = new AtpAgent({ service: NEW_PDS_URL });

  await oldAgent.login({
    identifier: CURRENT_HANDLE,
    password: CURRENT_PASSWORD,
  });

  const accountDid = oldAgent.session?.did;
  if (!accountDid) {
    throw new Error('Could not get DID for old account');
  }

  // Create account
  // ------------------

  const describeRes = await newAgent.api.com.atproto.server.describeServer();
  const newServerDid = describeRes.data.did;

  const serviceJwtRes = await oldAgent.com.atproto.server.getServiceAuth({
    aud: newServerDid,
    lxm: 'com.atproto.server.createAccount',
  });
  const serviceJwt = serviceJwtRes.data.token;

  await newAgent.api.com.atproto.server.createAccount(
    {
      handle: NEW_HANDLE,
      email: NEW_ACCOUNT_EMAIL,
      password: NEW_ACCOUNT_PASSWORD,
      did: accountDid,
      inviteCode: NEW_PDS_INVITE_CODE,
    },
    {
      headers: { authorization: `Bearer ${serviceJwt}` },
      encoding: 'application/json',
    },
  );
  await newAgent.login({
    identifier: NEW_HANDLE,
    password: NEW_ACCOUNT_PASSWORD,
  });

  // Migrate Data
  // ------------------

  const repoRes = await oldAgent.com.atproto.sync.getRepo({ did: accountDid });
  await newAgent.com.atproto.repo.importRepo(repoRes.data, {
    encoding: 'application/vnd.ipld.car',
  });

  let blobCursor: string | undefined = undefined;
  do {
    const listedBlobs = await oldAgent.com.atproto.sync.listBlobs({
      did: accountDid,
      cursor: blobCursor,
    });
    for (const cid of listedBlobs.data.cids) {
      const blobRes = await oldAgent.com.atproto.sync.getBlob({
        did: accountDid,
        cid,
      });
      await newAgent.com.atproto.repo.uploadBlob(blobRes.data, {
        encoding: blobRes.headers['content-type'],
      });
    }
    blobCursor = listedBlobs.data.cursor;
  } while (blobCursor);

  const prefs = await oldAgent.api.app.bsky.actor.getPreferences();
  await newAgent.api.app.bsky.actor.putPreferences(prefs.data);

  // Migrate Identity
  // ------------------

  const recoveryKey = await Secp256k1Keypair.create({ exportable: true });
  const privateKeyBytes = await recoveryKey.export();
  const privateKey = ui8.toString(privateKeyBytes, 'hex');

  await oldAgent.com.atproto.identity.requestPlcOperationSignature();

  const getDidCredentials =
    await newAgent.com.atproto.identity.getRecommendedDidCredentials();
  const rotationKeys = getDidCredentials.data.rotationKeys ?? [];
  if (!rotationKeys) {
    throw new Error('No rotation key provided');
  }
  const credentials = {
    ...getDidCredentials.data,
    rotationKeys: [recoveryKey.did(), ...rotationKeys],
  };

  // @NOTE, this token will need to come from the email from the previous step
  const TOKEN = '';

  const plcOp = await oldAgent.com.atproto.identity.signPlcOperation({
    token: TOKEN,
    ...credentials,
  });

  console.log(
    `❗ Your private recovery key is: ${privateKey}. Please store this in a secure location! ❗`,
  );

  await newAgent.com.atproto.identity.submitPlcOperation({
    operation: plcOp.data.operation,
  });

  // Finalize Migration
  // ------------------

  await newAgent.com.atproto.server.activateAccount();
  await oldAgent.com.atproto.server.deactivateAccount({});
};
```
