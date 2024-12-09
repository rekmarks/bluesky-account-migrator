import type { Argv, CommandModule } from 'yargs';
import { hello } from '../index.js';

type HelloArgs = { universe: boolean };

const helloCommand: CommandModule<{}, HelloArgs> = {
  command: ['hello'],
  describe: 'Say hello',
  builder: (yarg: Argv) => {
    return yarg.option('universe', {
      alias: 'u',
      desc: 'Say hello to the universe',
      type: 'boolean',
    }) as Argv<HelloArgs>;
  },
  handler: async (argv) => {
    console.log(hello(argv.universe ? 'universe' : 'world'));
  },
};

export const commands = [helloCommand];
