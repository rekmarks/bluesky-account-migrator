import { describe, expect, it } from 'vitest';
import { stripHandlePrefix } from './credentials.js';

describe('stripHandlePrefix', () => {
  it('should strip the @ prefix from the handle', () => {
    expect(stripHandlePrefix('@foo')).toBe('foo');
  });
});
