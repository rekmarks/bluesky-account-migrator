import { describe, expect, it, vi } from 'vitest';

import {
  getCredentialsInteractive,
  promptMessages,
  stripHandlePrefix,
  validateUrl,
  validateString,
  validateEmail,
  validateHandle,
  validateTemporaryHandle,
} from './credentials.js';
import * as prompts from './prompts.js';

vi.mock('boxen', () => ({
  default: vi.fn(),
}));

vi.mock('yoctocolors', () => ({
  bold: vi.fn((value) => value),
  green: vi.fn((value) => value),
}));

vi.mock('./prompts.js', () => ({
  input: vi.fn(),
  password: vi.fn(),
  confirm: vi.fn(),
}));

describe('getCredentialsInteractive', () => {
  it('should collect credentials in correct order with direct PDS handle', async () => {
    const mockInputs = {
      oldPdsUrl: 'https://bsky.social',
      oldHandle: 'user.bsky.social',
      oldPassword: 'oldpass123',
      inviteCode: 'invite123',
      newPdsUrl: 'https://new-pds.social',
      newHandle: 'user.new-pds.social',
      newEmail: 'user@example.com',
      newPassword: 'newpass123',
    };

    vi.mocked(prompts.input)
      .mockResolvedValueOnce(mockInputs.oldPdsUrl)
      .mockResolvedValueOnce(mockInputs.oldHandle)
      .mockResolvedValueOnce(mockInputs.inviteCode)
      .mockResolvedValueOnce(mockInputs.newPdsUrl)
      .mockResolvedValueOnce(mockInputs.newHandle)
      .mockResolvedValueOnce(mockInputs.newEmail);

    vi.mocked(prompts.password)
      .mockResolvedValueOnce(mockInputs.oldPassword)
      .mockResolvedValueOnce(mockInputs.newPassword)
      .mockResolvedValueOnce(mockInputs.newPassword); // confirmPassword

    // "Complete migration with these credentials?"
    vi.mocked(prompts.confirm).mockResolvedValueOnce(true);

    const credentials = await getCredentialsInteractive();

    // Verify prompts were called in correct order
    expect(prompts.input).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: promptMessages.oldPdsUrl,
      }),
    );
    expect(prompts.input).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: promptMessages.oldHandle,
      }),
    );
    expect(prompts.password).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: promptMessages.oldPassword,
      }),
    );
    expect(prompts.input).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        message: promptMessages.inviteCode,
      }),
    );
    expect(prompts.input).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        message: promptMessages.newPdsUrl,
      }),
    );
    expect(prompts.input).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        message: promptMessages.newHandle('new-pds.social'),
      }),
    );
    expect(prompts.input).toHaveBeenNthCalledWith(
      6,
      expect.objectContaining({
        message: promptMessages.newEmail,
      }),
    );

    // Verify returned credentials
    expect(credentials).toStrictEqual({
      oldPdsUrl: mockInputs.oldPdsUrl,
      oldHandle: mockInputs.oldHandle,
      oldPassword: mockInputs.oldPassword,
      inviteCode: mockInputs.inviteCode,
      newPdsUrl: mockInputs.newPdsUrl,
      newHandle: { handle: mockInputs.newHandle },
      newEmail: mockInputs.newEmail,
      newPassword: mockInputs.newPassword,
    });
  });

  it('should handle temporary handle flow for custom domains', async () => {
    const mockInputs = {
      oldPdsUrl: 'https://bsky.social',
      oldHandle: 'user.bsky.social',
      oldPassword: 'oldpass123',
      inviteCode: 'invite123',
      newPdsUrl: 'https://new-pds.social',
      newHandle: 'user.custom.com',
      newTemporaryHandle: 'user-temp.new-pds.social',
      newEmail: 'user@example.com',
      newPassword: 'newpass123',
    };

    vi.mocked(prompts.input)
      .mockResolvedValueOnce(mockInputs.oldPdsUrl)
      .mockResolvedValueOnce(mockInputs.oldHandle)
      .mockResolvedValueOnce(mockInputs.inviteCode)
      .mockResolvedValueOnce(mockInputs.newPdsUrl)
      .mockResolvedValueOnce(mockInputs.newHandle)
      .mockResolvedValueOnce(mockInputs.newTemporaryHandle)
      .mockResolvedValueOnce(mockInputs.newEmail);

    vi.mocked(prompts.password)
      .mockResolvedValueOnce(mockInputs.oldPassword)
      .mockResolvedValueOnce(mockInputs.newPassword)
      .mockResolvedValueOnce(mockInputs.newPassword);

    vi.mocked(prompts.confirm).mockResolvedValueOnce(true);

    const credentials = await getCredentialsInteractive();

    // Verify temporary handle prompt was shown
    expect(prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({
        message: promptMessages.newTemporaryHandle,
      }),
    );

    // Verify returned credentials include both handles
    expect(credentials).toStrictEqual({
      oldPdsUrl: mockInputs.oldPdsUrl,
      oldHandle: mockInputs.oldHandle,
      oldPassword: mockInputs.oldPassword,
      inviteCode: mockInputs.inviteCode,
      newPdsUrl: mockInputs.newPdsUrl,
      newHandle: {
        temporaryHandle: mockInputs.newTemporaryHandle,
        finalHandle: mockInputs.newHandle,
      },
      newEmail: mockInputs.newEmail,
      newPassword: mockInputs.newPassword,
    });
  });

  it('should return undefined if user does not confirm', async () => {
    const mockInputs = {
      oldPdsUrl: 'https://bsky.social',
      oldHandle: 'user.bsky.social',
      oldPassword: 'test123',
      inviteCode: 'test-invite',
      newPdsUrl: 'https://new-pds.social',
      newHandle: 'user.new-pds.social',
      newEmail: 'test@example.com',
      newPassword: 'newpass123',
    };

    vi.mocked(prompts.input)
      .mockResolvedValueOnce(mockInputs.oldPdsUrl)
      .mockResolvedValueOnce(mockInputs.oldHandle)
      .mockResolvedValueOnce(mockInputs.inviteCode)
      .mockResolvedValueOnce(mockInputs.newPdsUrl)
      .mockResolvedValueOnce(mockInputs.newHandle)
      .mockResolvedValueOnce(mockInputs.newEmail);

    vi.mocked(prompts.password)
      .mockResolvedValueOnce(mockInputs.oldPassword)
      .mockResolvedValueOnce(mockInputs.newPassword)
      .mockResolvedValueOnce(mockInputs.newPassword);

    vi.mocked(prompts.confirm).mockResolvedValueOnce(false);

    const credentials = await getCredentialsInteractive();

    expect(credentials).toBeUndefined();
  });
});

describe('stripHandlePrefix', () => {
  it('should strip the @ prefix from the handle', () => {
    expect(stripHandlePrefix('@foo')).toBe('foo');
  });

  it('should return the same string if no @ prefix exists', () => {
    expect(stripHandlePrefix('foo')).toBe('foo');
  });

  it('should only strip @ from the start of the string', () => {
    expect(stripHandlePrefix('foo@bar')).toBe('foo@bar');
    expect(stripHandlePrefix('@foo@bar')).toBe('foo@bar');
  });

  it('should handle empty strings', () => {
    expect(stripHandlePrefix('')).toBe('');
    expect(stripHandlePrefix('@')).toBe('');
  });

  it('should handle multiple @ prefixes', () => {
    expect(stripHandlePrefix('@@foo')).toBe('@foo');
  });
});

describe('validateUrl', () => {
  it.each([
    'http://example.com',
    'https://sub.example.com',
    'https://example.com/path',
  ])('should accept valid URL: %s', (url) => {
    expect(validateUrl(url)).toBe(true);
  });

  it.each([
    ['not-a-url'],
    ['ftp://example.com'],
    ['example.com'],
    ['http://'],
    ['https://'],
    [''],
  ])('should reject invalid URL: %s', (url) => {
    expect(validateUrl(url)).toBe('Must be a valid HTTP or HTTPS URL string');
  });
});

describe('validateString', () => {
  it.each(['hello', ' ', 'any non-empty string'])(
    'should accept non-empty string: %s',
    (str) => {
      expect(validateString(str)).toBe(true);
    },
  );

  it('should reject empty string', () => {
    expect(validateString('')).toBe('Must be a non-empty string');
  });
});

describe('validateEmail', () => {
  it.each([
    'user@example.com',
    'user+tag@sub.example.com',
    'complex.email+tag@sub.domain.com',
  ])('should accept valid email: %s', (email) => {
    expect(validateEmail(email)).toBe(true);
  });

  it.each([
    ['not-an-email'],
    ['@example.com'],
    ['user@'],
    [''],
    ['missing@tld'],
    ['spaces in@email.com'],
  ])('should reject invalid email: %s', (email) => {
    expect(validateEmail(email)).toBe('Must be a valid email address');
  });
});

describe('validateHandle', () => {
  it.each([
    'user.bsky.social',
    'user.custom.com',
    'complex-user.domain.social',
  ])('should accept valid handle: %s', (handle) => {
    expect(validateHandle(handle)).toBe(true);
  });

  it.each([
    ['not-a-handle'],
    ['@user.com'],
    [''],
    ['no-dots'],
    ['invalid..dots'],
  ])('should reject invalid handle: %s', (handle) => {
    expect(validateHandle(handle)).toBe('Must be a valid handle');
  });
});

describe('validateTemporaryHandle', () => {
  it.each([
    ['user.bsky.social', 'bsky.social'],
    ['temp-user.bsky.social', 'bsky.social'],
    ['complex-temp.bsky.social', 'bsky.social'],
  ])(
    'should accept valid temporary handle: %s for PDS: %s',
    (handle, hostname) => {
      expect(validateTemporaryHandle(handle, hostname)).toBe(true);
    },
  );

  it.each([
    ['user.other.social', 'bsky.social'],
    ['user.custom.com', 'bsky.social'],
    ['not-a-handle', 'bsky.social'],
    ['', 'bsky.social'],
    ['wrong.domain.social', 'bsky.social'],
  ])(
    'should reject invalid temporary handle: %s for PDS: %s',
    (handle, hostname) => {
      expect(validateTemporaryHandle(handle, hostname)).toBe(
        'Must be a valid handle and a subdomain of the new PDS hostname',
      );
    },
  );
});
