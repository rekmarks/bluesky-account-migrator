import { describe, it, expect } from 'vitest';

import { isPartialSerializedMigration } from './types.js';
import { makeMockCredentials } from '../../test/utils.js';

describe('isPartialMigration', () => {
  it('returns true for valid partial migration without token', () => {
    const credentials = makeMockCredentials();
    expect(isPartialSerializedMigration({ credentials })).toBe(true);
  });

  it('returns true for valid partial migration with token', () => {
    const credentials = makeMockCredentials();
    expect(
      isPartialSerializedMigration({
        credentials,
        confirmationToken: '123456',
      }),
    ).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['number', 42],
    ['string', 'string'],
    ['array', []],
  ])('returns false for non-object: %s', (_, value) => {
    expect(isPartialSerializedMigration(value)).toBe(false);
  });

  it.each([
    ['empty object', {}],
    ['object with only token', { confirmationToken: '123456' }],
  ])('returns false for object without credentials: %s', (_, value) => {
    expect(isPartialSerializedMigration(value)).toBe(false);
  });

  it.each([
    ['state', { state: 'RequestedPlcOperation', credentials: {} }],
    [
      'state',
      { state: 'Finalized', credentials: {}, confirmationToken: '123456' },
    ],
    ['state', { state: 'Foo', credentials: {}, confirmationToken: '123456' }],
  ])('returns false for object with state: %s', (_, value) => {
    expect(isPartialSerializedMigration(value)).toBe(false);
  });

  it.each([
    ['number token', { confirmationToken: 123 }],
    ['object token', { confirmationToken: {} }],
  ])('returns false for invalid confirmation token: %s', (_, value) => {
    const credentials = makeMockCredentials();
    expect(isPartialSerializedMigration({ credentials, ...value })).toBe(false);
  });

  it.each([
    ['empty object', {}],
    ['object with properties', { foo: 'bar' }],
  ])('allows credentials as %s', (_, credentials) => {
    expect(isPartialSerializedMigration({ credentials })).toBe(true);
  });
});
