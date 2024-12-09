import packageJson from 'bluesky-account-migrator/package.json' assert { type: 'json' };
import yargs from 'yargs';
import type { CommandModule } from 'yargs';
import { hideBin } from 'yargs/helpers';

export async function cli(argv: string[], commands: CommandModule<any, any>[]) {
  await yargs(hideBin(argv))
    .scriptName('bluesky-account-migrator')
    .version(packageJson.version)
    .usage('Usage: $0 <command> [options]')
    .strict()
    .demandCommand(1)
    .command(commands)
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .parseAsync();
}
