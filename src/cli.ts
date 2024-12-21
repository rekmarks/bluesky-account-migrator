import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { Commands } from './commands/index.js';
import packageJson from 'bluesky-account-migrator/package.json' assert { type: 'json' };

const usageDescription = `
Usage:
  $0 [migrate] [options]
  bam [migrate] [options]`;

export async function cli(argv: string[], commands: Commands) {
  await yargs(hideBin(argv))
    .scriptName('bluesky-account-migrator')
    .strict()
    .usage(usageDescription)
    .version(packageJson.version)
    .help()
    .showHelpOnFail(false)
    .alias('help', 'h')
    .alias('version', 'v')
    .option('debug', {
      describe: 'Show error stack traces',
      type: 'boolean',
      default: false,
    })
    .command(commands)
    .demandCommand(1)
    .parseAsync();
}
