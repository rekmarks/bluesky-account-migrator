import { defaultCommand, migrateCommand } from './migrate/index.js';

export const commands = [defaultCommand, migrateCommand];

export type Commands = typeof commands;
