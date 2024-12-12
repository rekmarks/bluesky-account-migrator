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
    const url = new URL(value);
    if (typeof url.protocol === 'string' && url.protocol.startsWith('http')) {
      return true;
    }
  } catch (_error) {}
  return false;
};

export const stringify = (value: unknown) => JSON.stringify(value, null, 2);
