#!/usr/bin/env node

import { cli } from './cli.js';
import { commands } from './commands/index.js';

cli(process.argv, commands).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
