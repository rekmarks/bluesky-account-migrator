import type { Argv, CommandModule as RawCommandModule } from 'yargs';

import { handleInteractive } from './interactive.js';
import { handlePipe } from './pipe.js';
import { makeHandler } from '../../utils/cli.js';
import type { BaseArgv } from '../../utils/cli.js';

export type MigrateOptions = BaseArgv & {
  interactive: boolean;
  pipe: boolean;
};

type CommandModule<Args> = RawCommandModule<Record<string, unknown>, Args>;

const modeGroupLabel = 'Mode (choose one):';

export const migrateCommand: CommandModule<MigrateOptions> = {
  command: '$0',
  aliases: ['migrate', 'm'],
  describe: 'Perform a migration',
  builder: (yarg: Argv) => {
    return yarg
      .option('interactive', {
        alias: 'i',
        defaultDescription: 'true',
        describe: 'Run in interactive mode',
        conflicts: 'pipe',
        group: modeGroupLabel,
        type: 'boolean',
      })
      .option('pipe', {
        alias: 'p',
        describe: 'Run in pipe mode',
        conflicts: 'interactive',
        group: modeGroupLabel,
        type: 'boolean',
      })
      .middleware((argv) => {
        if (!argv.interactive && !argv.pipe) {
          argv.interactive = true;
        }
      })
      .showHelpOnFail(true) as Argv<MigrateOptions>;
  },
  handler: makeHandler(async (argv) => {
    if (argv.interactive) {
      await handleInteractive();
    } else if (argv.pipe) {
      await handlePipe();
    } else {
      // This should never happen
      throw new Error('Fatal: No mode specified');
    }
  }),
};
