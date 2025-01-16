import { describe, it, expect } from 'vitest';

import type { SerializedMigration } from '../../src/migration/types.js';
import type { MockOperationPlan } from '../mocks/operations.js';
import { getPackageJson, runCli } from '../utils/cli.js';
import { makeMockCredentials } from '../utils.js';

describe('CLI', () => {
  describe('pipe mode', () => {
    it('runs new migration to the RequestedPlcOperation state', async () => {
      const testPlan: MockOperationPlan = {};

      const credentials = makeMockCredentials();
      const input: SerializedMigration = {
        state: 'Ready',
        credentials,
      };

      const { stdout } = await runCli(['--pipe'], {
        input: JSON.stringify(input),
        testPlan,
      });

      const result = JSON.parse(stdout) as SerializedMigration;
      expect(result.state).toBe('RequestedPlcOperation');
      expect(result.credentials).toStrictEqual(credentials);
    });

    it('completes migration with confirmation token', async () => {
      const testPlan: MockOperationPlan = {
        newPrivateKey: '0xdeadbeef',
      };

      const credentials = makeMockCredentials();
      const input: SerializedMigration = {
        state: 'Ready',
        credentials,
        confirmationToken: '123456',
      };

      const { stdout } = await runCli(['--pipe'], {
        input: JSON.stringify(input),
        testPlan,
      });

      const result = JSON.parse(stdout) as Record<string, unknown>;
      expect(result.state).toBe('Finalized');
      expect(result.credentials).toStrictEqual(credentials);
      expect(result.newPrivateKey).toBe('0xdeadbeef');
    });

    it('handles invalid JSON input', async () => {
      const testPlan: MockOperationPlan = {
        failureState: 'Ready',
      };

      const { stderr, code } = await runCli(['--pipe'], {
        input: 'invalid json',
        testPlan,
      });

      expect(code).toBe(1);
      expect(stderr).toContain('Error: Invalid input: must be JSON');
    });

    it('handles migration failures', async () => {
      const testPlan: MockOperationPlan = {
        failureState: 'MigratedIdentity',
      };

      const credentials = makeMockCredentials();
      const input: SerializedMigration = {
        state: 'Ready',
        credentials,
        confirmationToken: '123456',
      };

      const { stdout, stderr, code } = await runCli(['--pipe'], {
        input: JSON.stringify(input),
        testPlan,
      });

      const result = JSON.parse(stdout) as SerializedMigration;
      expect(result.state).toBe(testPlan.failureState);
      expect(stderr).toContain(
        `Error: Migration failed during state "${testPlan.failureState}"`,
      );
      expect(code).toBe(1);
    });
  });

  // All interactive elements are mocked, but we at least test that the CLI
  // behaves as expected given a set of valid inputs. We rely on unit tests
  // for the interactive elements themselves.
  describe('interactive mode', () => {
    it('completes migration in interactive mode', async () => {
      const testPlan: MockOperationPlan = {
        newPrivateKey: '0xdeadbeef',
      };

      const { stdout, code } = await runCli(['--interactive'], {
        testPlan,
      });

      expect(code).toBe(0);
      expect(stdout).toContain(
        'Welcome to the Bluesky account migration tool!',
      );
      expect(stdout).toContain('Migration completed successfully');
      expect(stdout).toContain('0xdeadbeef');
    });

    it('handles migration failure before creating a new account', async () => {
      const testPlan: MockOperationPlan = {
        failureState: 'Ready',
      };

      const { stdout, stderr, code } = await runCli(['--interactive'], {
        testPlan,
      });

      expect(code).toBe(1);
      expect(stdout).toContain(
        'Welcome to the Bluesky account migration tool!',
      );
      expect(stdout).not.toContain(
        'The migration has created a new account, but it may not be ready to use yet.',
      );
      expect(stderr).toContain(
        `Error: Migration failed during state "${testPlan.failureState}"`,
      );
    });

    it('handles migration failure after creating a new account', async () => {
      const testPlan: MockOperationPlan = {
        failureState: 'RequestedPlcOperation',
      };

      const { stdout, stderr, code } = await runCli(['--interactive'], {
        testPlan,
      });

      expect(code).toBe(1);
      expect(stdout).toContain(
        'Welcome to the Bluesky account migration tool!',
      );
      expect(stdout).toContain(
        'The migration has created a new account, but it may not be ready to use yet.',
      );
      expect(stderr).toContain(
        `Error: Migration failed during state "${testPlan.failureState}"`,
      );
    });

    it('handles migration failure after private key is generated', async () => {
      const testPlan: MockOperationPlan = {
        failureState: 'MigratedIdentity',
        newPrivateKey: '0xdeadbeef',
      };

      const { stdout, stderr, code } = await runCli(['--interactive'], {
        testPlan,
      });

      expect(code).toBe(1);
      expect(stdout).toContain(
        'Welcome to the Bluesky account migration tool!',
      );
      expect(stdout).toContain(
        'The migration has created a new account, but it may not be ready to use yet.',
      );
      // expect(stdout).toContain('You should still save the private key in a secure location.');
      expect(stdout).toContain('0xdeadbeef');
      expect(stderr).toContain(
        `Error: Migration failed during state "${testPlan.failureState}"`,
      );
    });
  });

  describe('help', () => {
    it('shows help text', async () => {
      const testPlan: MockOperationPlan = {};
      const { stdout } = await runCli(['--help'], {
        testPlan,
      });
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Options:');
      expect(stdout).toContain('Mode (choose one):');
    });
  });

  describe('version', () => {
    it('shows version', async () => {
      const testPlan: MockOperationPlan = {};
      const { stdout } = await runCli(['--version'], {
        testPlan,
      });
      const { version } = await getPackageJson();
      expect(stdout).toContain(version);
    });
  });
});
