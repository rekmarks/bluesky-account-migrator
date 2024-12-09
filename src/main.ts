#!/usr/bin/env node

import { cli } from './cli.js';
import { commands } from './commands/index.js';

process.env.BROWSERSLIST_IGNORE_OLD_DATA = '1';

cli(process.argv, commands).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
