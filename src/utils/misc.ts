export const isObject = (
  value: unknown,
): value is Record<string | number | symbol, unknown> =>
  typeof value === 'object' && value !== null;

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
  } catch (_error) {
    return false;
  }
};

export const stringify = (value: unknown) => JSON.stringify(value, null, 2);

/**
 * Pick non-`#` properties from a type.
 * @param T - The type to pick public properties from.
 */
export type PickPublic<T> = Pick<
  T,
  {
    [K in keyof T]: K extends `#${string}` ? never : K;
  }[keyof T]
>;
