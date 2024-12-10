import type { Argv, CommandModule } from 'yargs';

type MigrateArgs = { universe: boolean };

export const migrateCommand: CommandModule<{}, MigrateArgs> = {
  command: ['migrate', 'm'],
  describe: 'Say hello',
  builder: (yarg: Argv) => {
    return yarg.option('universe', {
      alias: 'u',
      desc: 'Say hello to the universe',
      type: 'boolean',
    }) as Argv<MigrateArgs>;
  },
  handler: async (argv) => {
    console.log('Hello, migration!');
  },
};
