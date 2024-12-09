import { describe, expect, it } from 'vitest';
import { hello } from './index.js';

describe('hello', () => {
  it('should say hello to the world', () => {
    expect(hello()).toBe('Hello, world!');
  });

  it('should say hello to the universe', () => {
    expect(hello('universe')).toBe('Hello, universe!');
  });
});
