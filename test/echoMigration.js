// For getting a serialized migration object that can be piped to the CLI

const serializedMigration = {
  state: 'Ready',
  credentials: {
    oldPdsUrl: 'https://old.bsky.social',
    newPdsUrl: 'https://new.bsky.social',
    oldHandle: 'old.handle.com',
    oldPassword: 'oldpass123',
    newHandle: 'new.handle.com',
    newEmail: 'new@email.com',
    newPassword: 'newpass123',
    inviteCode: 'invite-123',
  },
  confirmationToken: '123456',
  newPrivateKey: '0xdeadbeef',
};

console.log(JSON.stringify(serializedMigration));

export {};
