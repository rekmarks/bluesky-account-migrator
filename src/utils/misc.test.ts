import { describe, it, expect } from 'vitest';

import { normalizeUrl, isHttpUrl } from './misc.js';

describe('normalizeUrl', () => {
  it.each([
    ['example.com', 'https://example.com'],
    ['sub.example.com', 'https://sub.example.com'],
    ['example.com/path', 'https://example.com/path'],
    ['example.com:8080', 'https://example.com:8080'],
  ])('should prepend https:// to %s', (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });

  it.each([
    ['https://example.com', 'https://example.com'],
    ['https://sub.example.com', 'https://sub.example.com'],
    ['http://example.com', 'http://example.com'],
    ['HTTP://example.com', 'HTTP://example.com'],
    ['HTTPS://example.com', 'HTTPS://example.com'],
  ])('should not modify %s', (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });
});

describe('isHttpUrl', () => {
  it.each([
    'http://example.com',
    'https://example.com',
    'https://sub.example.com',
    'https://example.com/path',
    'https://example.com:8080',
    'https://example.com:8080/path?query=1',
  ])('should return true for valid URL: %s', (url) => {
    expect(isHttpUrl(url)).toBe(true);
  });

  it.each([
    'not-a-url',
    'ftp://example.com',
    'example.com',
    'http://',
    'https://',
    '',
    null,
    undefined,
    123,
    {},
  ])('should return false for invalid input: %s', (url) => {
    expect(isHttpUrl(url)).toBe(false);
  });
});
