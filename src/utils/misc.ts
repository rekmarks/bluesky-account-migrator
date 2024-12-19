import { ZodError } from 'zod';

export const isPlainObject = (
  value: unknown,
): value is Record<string | number | symbol, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * @param value - The value to check.
 * @returns Whether the value is a valid HTTP or HTTPS URL.
 */
export const isHttpUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    return /^https?:$/u.test(new URL(value).protocol);
  } catch {
    return false;
  }
};

export const isEmail = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
};

export const stringify = (value: unknown) => JSON.stringify(value, null, 2);

/**
 * Handle an unknown error. Includes special handling for {@link ZodError} errors.
 *
 * @param message - The message to display.
 * @param error - The error to display.
 * @returns The readable error.
 */
export const handleUnknownError = (message: string, error: unknown): Error => {
  return error instanceof ZodError
    ? new Error(
        message +
          (error.issues ? '\n' + error.issues.map(stringify).join('\n') : ''),
        { cause: error },
      )
    : new Error(message, { cause: error });
};

/**
 * Pick non-`#` properties from a type.
 *
 * @template Type - The type to pick public properties from.
 */
export type PickPublic<Type> = Pick<
  Type,
  {
    [K in keyof Type]: K extends `#${string}` ? never : K;
  }[keyof Type]
>;
