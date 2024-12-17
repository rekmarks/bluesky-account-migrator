import { describe, it, expect } from 'vitest';

import { isValidHandle } from './handle.js';

describe('isValidHandle', () => {
  it.each([
    ['abc123.foo', true, 'handle with two segments'],
    ['abc123.ly', true, 'handle with two segments (two-character TLD)'],
    ['abc123.x', true, 'handle with two segments (one-character TLD)'],
    ['abc123.bsky.social', true, 'handle with three segments'],
    [
      'abc123.ly.social',
      true,
      'handle with three segments (two-character inner segment)',
    ],
    [
      'abc123.x.social',
      true,
      'handle with three segments (one-character inner segment)',
    ],
    ['valid-handle.bsky.social', true, 'with hyphen'],
    ['test.bsky.social', true, 'simple valid handle'],
    ['a1b2c3d4e5f6g7h8.bsky.social', true, 'long handle within limits'],
    ['abc.bsky.social', true, 'minimum length'],
    ['foo-bar-baz.bsky.social', true, 'multiple hyphens'],
    ['123handle.bsky.social', true, 'starts with number'],
    ['UPPERCASE.bsky.social', true, 'all uppercase'],
    ['mIxEdCaSe.bsky.social', true, 'mixed case'],
    ['aaa.bsky.social', true, 'minimum leftmost segment length'],
    [`${'a'.repeat(63)}.bsky.social`, true, 'maximum leftmost segment length'],
    ['foo', false, 'single segment, no periods'],
    ['foo.', false, 'single segment, ends with period'],
    ['.foo', false, 'single segment, starts with period'],
    ['foo..bar', false, 'two segments, multiple periods'],
    ['handle-.bsky.social', false, 'segment ends with hyphen'],
    ['-handle.bsky.social', false, 'segment starts with hyphen'],
    ['ab.bsky.social', false, 'leftmost segment too short (two characters)'],
    ['a.bsky.social', false, 'leftmost segment too short (one character)'],
    [`${'a'.repeat(64)}.bsky.social`, false, 'leftmost segment too long'],
    ['@handle.invalid', false, 'invalid character'],
  ])('%s should return %s (%s)', (handle, expected) => {
    expect(isValidHandle(handle)).toBe(expected);
  });
});
