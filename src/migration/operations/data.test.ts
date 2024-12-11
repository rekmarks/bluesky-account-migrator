import type { AppBskyActorGetPreferences } from '@atproto/api';
import { describe, it, expect, vi } from 'vitest';
import { migrateData } from './data.js';
import {
  mockAccountDid,
  makeMockAgent,
  makeXrpcResponse,
} from '../../../test/utils.js';

describe('migrateData', () => {
  it('should migrate repo, blobs, and preferences', async () => {
    const oldAgent = makeMockAgent(mockAccountDid);
    const newAgent = makeMockAgent();

    const mockRepoData = new Uint8Array();
    const mockPreferences = {
      preferences: {},
    } as unknown as AppBskyActorGetPreferences.OutputSchema;
    const mockBlobData = { data: new Uint8Array() };

    vi.mocked(oldAgent.com.atproto.sync.getRepo).mockResolvedValue(
      makeXrpcResponse(mockRepoData),
    );
    vi.mocked(oldAgent.app.bsky.actor.getPreferences).mockResolvedValue(
      makeXrpcResponse(mockPreferences),
    );
    vi.mocked(oldAgent.com.atproto.sync.listBlobs).mockResolvedValue(
      makeXrpcResponse({
        cids: ['cid1', 'cid2'],
        cursor: '',
      }),
    );

    vi.mocked(oldAgent.com.atproto.sync.getBlob).mockResolvedValue(
      makeXrpcResponse(mockBlobData.data, { 'content-type': 'image/jpeg' }),
    );

    await migrateData({
      oldAgent: oldAgent,
      newAgent: newAgent,
      accountDid: mockAccountDid,
    });

    expect(oldAgent.com.atproto.sync.getRepo).toHaveBeenCalledWith({
      did: mockAccountDid,
    });
    expect(newAgent.com.atproto.repo.importRepo).toHaveBeenCalledWith(
      mockRepoData,
      { encoding: 'application/vnd.ipld.car' },
    );

    expect(oldAgent.com.atproto.sync.listBlobs).toHaveBeenCalledWith({
      did: mockAccountDid,
    });

    expect(newAgent.com.atproto.repo.uploadBlob).toHaveBeenCalledTimes(2);
    expect(newAgent.app.bsky.actor.putPreferences).toHaveBeenCalledWith(
      mockPreferences,
    );
  });
});
