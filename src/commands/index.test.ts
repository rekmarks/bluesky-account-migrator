import { describe, expect, it } from 'vitest';

import { commands } from './index.js';
import { migrateCommand } from './migrate/index.js';

describe('commands', () => {
  it('should export an array containing the migrate command', () => {
    expect(commands).toStrictEqual([migrateCommand]);
  });
});
