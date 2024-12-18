import { describe, expect, it } from 'vitest';

import * as index from './index.js';

describe('index', () => {
  it('should have the expected exports', () => {
    expect(Object.keys(index).sort()).toStrictEqual([
      'isHttpUrl',
      'isValidHandle',
      'migration',
    ]);
    expect(Object.keys(index.migration).sort()).toStrictEqual([
      'Migration',
      'MigrationState',
      'operations',
    ]);
  });
});
