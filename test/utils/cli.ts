import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { stringify } from '../../src/utils/misc.js';
import type { MockOperationPlan } from '../mocks/operations.js';

type RunCliOptions = {
  input?: string;
  env?: Record<string, string>;
  testPlan: MockOperationPlan;
};

const normalizeOutput = (str: string) =>
  // First strip ANSI codes
  str
    .replace(
      // eslint-disable-next-line no-control-regex
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gu,
      '',
    )
    // Then normalize whitespace: convert newlines to spaces and collapse multiple spaces
    .replace(/\s+/gu, ' ')
    .trim();

export async function runCli(
  args: string[],
  options: RunCliOptions,
): Promise<{
  stdout: string;
  stderr: string;
  code: number;
}> {
  const { input, env, testPlan } = options;
  const shouldFail = testPlan.failureState !== undefined;
  const cliPath = await getCliPath();

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        MOCK_OPERATIONS_PLAN: JSON.stringify(testPlan),
        ...env,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.on('close', (code) => {
      const failed = code !== 0;
      if (!failed && shouldFail) {
        reject(
          new Error(
            `Expected command to fail, but it succeeded: \n${stringify({
              stdout,
              stderr,
            })}`,
          ),
        );
      } else if (failed && !shouldFail) {
        reject(
          new Error(
            `Command failed unexpectedly: ${code}\n${stringify({ stdout, stderr })}`,
          ),
        );
      } else {
        resolve({
          stdout: normalizeOutput(stdout),
          stderr: normalizeOutput(stderr),
          code: code ?? 0,
        });
      }
    });
  });
}

async function getCliPath() {
  const packageJson = await getPackageJson();
  return join(getRootDir(), packageJson.bin.bam);
}

export async function getPackageJson() {
  const rootDir = getRootDir();
  return JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'));
}

function getRootDir() {
  return join(import.meta.dirname, '../..');
}
