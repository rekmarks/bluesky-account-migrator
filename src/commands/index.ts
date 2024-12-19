import { migrateCommand } from './migrate/index.js';

export const commands = [migrateCommand];

export type Commands = typeof commands;
