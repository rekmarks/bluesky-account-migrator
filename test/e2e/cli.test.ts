import { describe, it, expect } from 'vitest';

import type { SerializedMigration } from '../../src/migration/types.js';
import { getPackageJson, runCli } from '../utils/cli.js';
import { makeMockCredentials } from '../utils.js';

describe('CLI', () => {
  describe('pipe mode', () => {
    it('completes migration when given valid input', async () => {
      const credentials = makeMockCredentials();
      const input: SerializedMigration = {
        state: 'Ready',
        credentials,
      };

      const { stdout } = await runCli(['--pipe'], {
        input: JSON.stringify(input),
      });

      const result = JSON.parse(stdout) as SerializedMigration;
      expect(result.state).toBe('RequestedPlcOperation');
      expect(result.credentials).toStrictEqual(credentials);
    });

    it('completes migration with confirmation token', async () => {
      const credentials = makeMockCredentials();
      const input: SerializedMigration = {
        state: 'Ready',
        credentials,
        confirmationToken: '123456',
      };

      const { stdout } = await runCli(['--pipe'], {
        input: JSON.stringify(input),
      });

      const result = JSON.parse(stdout) as Record<string, unknown>;
      expect(result.state).toBe('Finalized');
      expect(result.credentials).toStrictEqual(credentials);
      expect(result.newPrivateKey).toBe('0xdeadbeef');
    });

    it('handles invalid JSON input', async () => {
      const { stderr, code } = await runCli(['--pipe'], {
        input: 'invalid json',
        expectError: true,
      });

      expect(code).toBe(1);
      expect(stderr).toContain('Error: Invalid input: must be JSON');
    });

    it('handles migration failures', async () => {
      const credentials = makeMockCredentials();
      const input: SerializedMigration = {
        state: 'Ready',
        credentials,
      };

      // Set failure condition via env var
      const { stdout, stderr, code } = await runCli(['--pipe'], {
        input: JSON.stringify(input),
        env: { FAILURE_CONDITION: 'MigratedData' },
        expectError: true,
      });

      const result = JSON.parse(stdout) as SerializedMigration;
      expect(result.state).toBe('MigratedData');
      expect(stderr).toContain(
        'Error: Migration failed during state "MigratedData"',
      );
      expect(code).toBe(1);
    });
  });

  describe('help', () => {
    it('shows help text', async () => {
      const { stdout } = await runCli(['--help']);
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Options:');
      expect(stdout).toContain('Mode (choose one):');
    });
  });

  describe('version', () => {
    it('shows version', async () => {
      const { stdout } = await runCli(['--version']);
      const { version } = await getPackageJson();
      expect(stdout).toContain(version);
    });
  });
});
