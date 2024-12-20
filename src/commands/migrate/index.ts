import type { Argv, CommandModule as RawCommandModule } from 'yargs';

import { handleInteractive } from './interactive.js';
import { handlePipe } from './pipe.js';

type Mode = 'interactive' | 'i' | 'stdin' | 's';

export type MigrateOptions = {
  mode: Mode;
};

type CommandModule<Args> = RawCommandModule<Record<string, unknown>, Args>;

export const migrateCommand: CommandModule<MigrateOptions> = {
  command: 'migrate [mode]',
  aliases: ['m'],
  describe: 'Perform a migration',
  builder: (yarg: Argv) => {
    return yarg
      .option('mode', {
        describe: 'The migration mode to use',
        type: 'string',
        default: 'interactive',
        choices: ['interactive', 'i', 'pipe', 'p'],
      })
      .demandOption('mode') as Argv<MigrateOptions>;
  },
  handler: async (argv) => {
    if (argv.mode.startsWith('i')) {
      await handleInteractive();
    } else if (argv.mode.startsWith('p')) {
      await handlePipe();
    } else {
      // This should never happen
      throw new Error(
        `Fatal: Migration mode not yet implemented: ${argv.mode}`,
      );
    }
  },
};

export const defaultCommand: CommandModule<MigrateOptions> = {
  command: '$0 [mode]',
  describe: migrateCommand.describe,
  builder: migrateCommand.builder,
  handler: migrateCommand.handler,
};
