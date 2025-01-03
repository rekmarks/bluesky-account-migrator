import {
  confirm as _confirm,
  input as _input,
  password as _password,
} from '@inquirer/prompts';

import { logWrapped } from '../../utils/terminal.js';

const wrapPrompt = <PromptFn extends (...args: any[]) => Promise<unknown>>(
  prompt: PromptFn,
) => {
  return async (...args: Parameters<PromptFn>) => {
    try {
      const result = await prompt(...args);
      return typeof result === 'string' ? result.trim() : result;
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        // The user exited the prompt. Wait for the next tick to avoid
        // yielding control back to the caller before the process exits.
        return await new Promise(process.nextTick);
      }
      throw error;
    }
  };
};

export const input = wrapPrompt(_input) as typeof _input;
export const password = wrapPrompt(_password) as typeof _password;
export const confirm = wrapPrompt(_confirm) as typeof _confirm;

export const pressEnter = async (message = 'Press Enter to continue...') => {
  logWrapped(message);
  process.stdin.resume();
  await new Promise<void>((resolve) =>
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    }),
  );
};
