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
  } catch {
    return false;
  }
};

export const stringify = (value: unknown) => JSON.stringify(value, null, 2);

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
