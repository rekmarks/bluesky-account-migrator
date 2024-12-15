import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { Commands } from './commands/index.js';
import packageJson from 'bluesky-account-migrator/package.json' assert { type: 'json' };

export async function cli(argv: string[], commands: Commands) {
  await yargs(hideBin(argv))
    .scriptName('bluesky-account-migrator')
    .version(packageJson.version)
    .usage('Usage: $0 <command> [options]')
    .strict()
    .demandCommand(1)
    .command(commands)
    .help()
    .showHelpOnFail(false)
    .alias('help', 'h')
    .alias('version', 'v')
    .parseAsync();
}
