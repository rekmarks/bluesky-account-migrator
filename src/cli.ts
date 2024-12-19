import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { Commands } from './commands/index.js';
import packageJson from 'bluesky-account-migrator/package.json' assert { type: 'json' };

export async function cli(argv: string[], commands: Commands) {
  await yargs(hideBin(argv))
    .scriptName('bluesky-account-migrator')
    .strict()
    .usage('Usage: $0 <command> [options]')
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
