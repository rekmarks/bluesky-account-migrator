import assert from 'assert';
import boxen from 'boxen';
import wrapAnsi from 'wrap-ansi';

const getTermWidth = () => process.stdout.columns || 50;

/**
 * Log a line of text to the terminal.
 *
 * @param character - The character to use for the line.
 */
export const logLine = (character: string) => {
  assert(character.length === 1, 'Must provide a single character');
  console.log(character.repeat(getTermWidth()));
};

export const logWarning = (message: string) => {
  console.log(
    boxen(message, { padding: 1, borderColor: 'yellow', title: '⚠️' }),
  );
};

export const logWelcome = () => {
  console.log(
    boxen('Welcome to the Bluesky account migration tool!', {
      padding: 1,
      borderColor: 'blue',
      title: '🦋',
    }),
  );
};

/**
 * Log a message to the terminal, center and wrapped to the terminal width.
 *
 * @param message - The message to log.
 * @param padding - The number of columns to pad the message with on the left _and_ right.
 */
export const logWrapped = (message: string, padding: number = 3) => {
  const wrapped = wrapAnsi(message, getTermWidth() - padding, { hard: true });

  const output = wrapped
    .split('\n')
    .map((line) => ' '.repeat(padding) + line)
    .join('\n');

  console.log(output);
};
