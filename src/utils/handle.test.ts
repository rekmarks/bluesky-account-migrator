import { describe, it, expect } from 'vitest';

import { isValidHandle } from './handle.js';

describe('isValidHandle', () => {
  it.each([
    ['valid-handle', true, 'basic handle with hyphen'],
    ['abc123', true, 'alphanumeric'],
    ['test', true, 'simple valid handle'],
    ['a1b2c3d4e5f6g7h8', true, 'long handle within limits'],
    ['abc', true, 'minimum length'],
    ['foo-bar-baz', true, 'multiple hyphens'],
    ['123handle', true, 'starts with number'],
    ['UPPERCASE', true, 'all uppercase'],
    ['mIxEdCaSe', true, 'mixed case'],
    ['aaa', true, 'minimum length'],
    ['a'.repeat(63), true, 'maximum length'],
    ['handle-', false, 'ends with hyphen'],
    ['-handle', false, 'starts with hyphen'],
    ['ab', false, 'too short'],
    ['a'.repeat(64), false, 'too long'],
    ['handle.invalid', false, 'invalid character'],
  ])('%s should return %s (%s)', (handle, expected) => {
    expect(isValidHandle(handle)).toBe(expected);
  });
});
