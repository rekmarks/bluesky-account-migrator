import type { AgentPair } from '../types.js';

export async function migrateData({
  fromAgent,
  toAgent,
  accountDid,
}: AgentPair): Promise<void> {
  // Migrate repo
  const repoRes = await fromAgent.com.atproto.sync.getRepo({ did: accountDid });
  await toAgent.com.atproto.repo.importRepo(repoRes.data, {
    encoding: 'application/vnd.ipld.car',
  });

  // Migrate blobs
  await migrateBlobs({ fromAgent: fromAgent, toAgent: toAgent, accountDid });

  // Migrate preferences
  const prefs = await fromAgent.app.bsky.actor.getPreferences();
  await toAgent.app.bsky.actor.putPreferences(prefs.data);
}

async function migrateBlobs({
  fromAgent,
  toAgent,
  accountDid,
}: AgentPair): Promise<void> {
  let blobCursor: string | undefined = undefined;
  do {
    const listedBlobs = await fromAgent.com.atproto.sync.listBlobs({
      did: accountDid,
      ...(blobCursor ? { cursor: blobCursor } : {}),
    });

    for (const cid of listedBlobs.data.cids) {
      const blobRes = await fromAgent.com.atproto.sync.getBlob({
        did: accountDid,
        cid,
      });
      const contentType = blobRes.headers['content-type'];
      const opts = contentType ? { encoding: contentType } : undefined;

      await toAgent.com.atproto.repo.uploadBlob(blobRes.data, opts);
    }
    blobCursor = listedBlobs.data.cursor;
  } while (blobCursor);
}
