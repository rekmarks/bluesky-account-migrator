import type { Argv, CommandModule } from 'yargs';
import { handleMigrateInteractive } from './handler.js';

type Mode = 'interactive' | 'i';

export type MigrateOptions = {
  mode: Mode;
};

export const migrateCommand: CommandModule<{}, MigrateOptions> = {
  command: 'migrate [mode]',
  aliases: ['m'],
  describe: 'Perform a migration',
  builder: (yarg: Argv) => {
    return yarg.positional('mode', {
      describe: 'Run in interactive mode',
      type: 'string',
      default: 'interactive',
      choices: ['interactive', 'i'],
    }) as Argv<{ mode: Mode }>;
  },
  handler: async (argv) => {
    if (argv.mode.startsWith('i')) {
      await handleMigrateInteractive();
    } else {
      throw new Error('Not yet implemented');
    }
  },
};

export const defaultCommand: CommandModule<{}, MigrateOptions> = {
  command: '$0 [mode]',
  describe: migrateCommand.describe,
  builder: migrateCommand.builder,
  handler: migrateCommand.handler,
};
