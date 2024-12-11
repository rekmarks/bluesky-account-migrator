import { input as _input, password as _password } from '@inquirer/prompts';

const wrapPrompt = <T extends (...args: any[]) => Promise<unknown>>(
  prompt: T,
) => {
  return async (...args: Parameters<T>) => {
    try {
      return await prompt(...args);
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
