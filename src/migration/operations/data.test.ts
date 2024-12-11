import { describe, it, expect, vi } from 'vitest';
import { migrateData } from './data.js';
import { mockAccountDid, makeMockAgent } from '../../../test/utils.js';

describe('migrateData', () => {
  it('should migrate repo, blobs, and preferences', async () => {
    const fromAgent = makeMockAgent(mockAccountDid);
    const toAgent = makeMockAgent();

    const mockRepoData = {
      /* mock CAR data */
    };
    const mockPreferences = {
      data: {
        /* mock preferences */
      },
    };
    const mockBlobData = { data: new Uint8Array() };

    vi.mocked(fromAgent.com.atproto.sync.getRepo).mockResolvedValue({
      // @ts-expect-error
      data: mockRepoData,
    });
    vi.mocked(fromAgent.app.bsky.actor.getPreferences).mockResolvedValue(
      // @ts-expect-error
      mockPreferences,
    );
    vi.mocked(fromAgent.com.atproto.sync.listBlobs).mockResolvedValue({
      // @ts-expect-error
      data: {
        cids: ['cid1', 'cid2'],
        cursor: undefined,
      },
    });
    // @ts-expect-error
    vi.mocked(fromAgent.com.atproto.sync.getBlob).mockResolvedValue({
      data: mockBlobData.data,
      headers: { 'content-type': 'image/jpeg' },
    });

    await migrateData({
      fromAgent: fromAgent,
      toAgent: toAgent,
      accountDid: mockAccountDid,
    });

    expect(fromAgent.com.atproto.sync.getRepo).toHaveBeenCalledWith({
      did: mockAccountDid,
    });
    expect(toAgent.com.atproto.repo.importRepo).toHaveBeenCalledWith(
      mockRepoData,
      { encoding: 'application/vnd.ipld.car' },
    );

    expect(fromAgent.com.atproto.sync.listBlobs).toHaveBeenCalledWith({
      did: mockAccountDid,
    });

    expect(toAgent.com.atproto.repo.uploadBlob).toHaveBeenCalledTimes(2);
    expect(toAgent.app.bsky.actor.putPreferences).toHaveBeenCalledWith(
      mockPreferences.data,
    );
  });
});
