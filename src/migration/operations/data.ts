import type { AgentPair } from '../types.js';

/**
 * Migrate the data repository, blobs, and preferences from the old PDS to the new PDS.
 *
 * @param options - Options bag.
 * @param options.agents - The agent pair.
 */
export async function migrateData({
  oldAgent,
  newAgent,
  accountDid,
}: AgentPair): Promise<void> {
  // Migrate repo
  const repoRes = await oldAgent.com.atproto.sync.getRepo({ did: accountDid });
  await newAgent.com.atproto.repo.importRepo(repoRes.data, {
    encoding: 'application/vnd.ipld.car',
  });

  // Migrate blobs
  await migrateBlobs({ oldAgent: oldAgent, newAgent: newAgent, accountDid });

  // Migrate preferences
  const prefs = await oldAgent.app.bsky.actor.getPreferences();
  await newAgent.app.bsky.actor.putPreferences(prefs.data);
}

async function migrateBlobs({
  oldAgent,
  newAgent,
  accountDid,
}: AgentPair): Promise<void> {
  let blobCursor: string | undefined = undefined;
  do {
    const listedBlobs = await oldAgent.com.atproto.sync.listBlobs({
      did: accountDid,
      ...(blobCursor ? { cursor: blobCursor } : {}),
    });

    for (const cid of listedBlobs.data.cids) {
      const blobRes = await oldAgent.com.atproto.sync.getBlob({
        did: accountDid,
        cid,
      });
      const contentType = blobRes.headers['content-type'];
      const opts = contentType ? { encoding: contentType } : undefined;

      await newAgent.com.atproto.repo.uploadBlob(blobRes.data, opts);
    }
    blobCursor = listedBlobs.data.cursor;
  } while (blobCursor);
}