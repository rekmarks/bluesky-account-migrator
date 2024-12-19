import type { ArgumentsCamelCase } from 'yargs';

import { intoError } from './misc.js';

export type BaseArgv = ArgumentsCamelCase & {
  debug: boolean;
};

type Handler<Argv extends BaseArgv> = (argv: Argv) => void | Promise<void>;

/**
 * Wraps a handler function to catch errors and handle them based on the debug flag.
 *
 * @param handlerFn - The handler function to wrap.
 * @returns The wrapped handler function.
 */
export function makeHandler<Argv extends BaseArgv>(
  handlerFn: Handler<Argv>,
): Handler<Argv> {
  return async (argv) => {
    try {
      await handlerFn(argv);
    } catch (thrown) {
      const error = intoError(thrown);
      prefixErrorMessage(error);
      console.error(argv.debug ? error : error.message);
      process.exitCode = 1;
    }
  };
}

function prefixErrorMessage(error: Error): void {
  if (!error.message.startsWith('Error')) {
    error.message = 'Error: ' + error.message;
  }
}
