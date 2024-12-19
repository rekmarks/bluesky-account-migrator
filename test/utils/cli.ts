import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

type RunCliOptions = {
  input?: string;
  env?: Record<string, string>;
  expectError?: boolean;
};

export async function runCli(
  args: string[],
  options: RunCliOptions = {},
): Promise<{
  stdout: string;
  stderr: string;
  code: number;
}> {
  const { input, env, expectError = false } = options;

  const cliPath = await getCliPath();

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      env: { ...process.env, NODE_ENV: 'test', ...env },
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
      if ((failed && !expectError) || (!failed && expectError)) {
        reject(
          Object.assign(new Error('Command failed'), { stdout, stderr, code }),
        );
      } else {
        resolve({ stdout, stderr, code: code ?? 0 });
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
