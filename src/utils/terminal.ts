import assert from 'assert';
import boxen from 'boxen';
import wrapAnsi from 'wrap-ansi';
import { red } from 'yoctocolors-cjs';

const getTermWidth = () => process.stdout.columns || 50;

export const logWelcome = () => {
  console.log(
    boxen('Welcome to the Bluesky account migration tool!', {
      padding: 1,
      borderColor: 'blue',
      title: '🦋',
    }),
  );
};

export const logWrapped = (message: string) => {
  console.log(wrap(message));
};

/**
 * Log a delimiter line to stdout.
 *
 * @param character - The character to use for the line.
 */
export const logDelimiter = (character: string) => {
  assert(character.length === 1, 'Must provide a single character');
  console.log(character.repeat(getTermWidth()));
};

export const logWarning = (message: string) => {
  console.log(
    boxen(message, { padding: 1, borderColor: 'yellow', title: '⚠️' }),
  );
};

export const logError = (
  error: unknown,
  fallback = 'An unknown error occurred, please report this bug',
) => {
  let message;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = fallback;
  }

  console.log(wrap(red(message)));
};

/**
 * Log a message to stdout, centered and wrapped to the terminal width.
 *
 * @param message - The message to log.
 * @param padding - The number of columns to pad the message with on the left _and_ right.
 */
export const logCentered = (message: string, padding: number = 3) => {
  const wrapped = wrap(message, padding);

  const output = wrapped
    .split('\n')
    .map((line) => ' '.repeat(padding) + line)
    .join('\n');

  console.log(output);
};

function wrap(message: string, padding = 0) {
  return wrapAnsi(message, getTermWidth() - padding, { hard: true });
}
