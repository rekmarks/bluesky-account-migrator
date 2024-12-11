import type { Options } from 'yargs';

/**
 * @param arg - The URL string to coerce.
 * @throws If the URL string is not a valid HTTP or HTTPS URL.
 * @returns The URL string.
 */
const coerceUrl = (arg: string): string => {
  try {
    const url = new URL(arg);
    if (typeof url.protocol === 'string' && url.protocol.startsWith('http')) {
      return url.toString();
    }
  } catch (_error) {}
  throw new Error('Must be a valid HTTP or HTTPS URL string');
};

const makeRawBuilders = () =>
  ({
    from: {
      alias: 'f',
      desc: 'The source PDS URL, e.g. https://bsky.social',
      type: 'string',
      coerce: coerceUrl,
    },
    to: {
      alias: 't',
      desc: 'The destination PDS URL, e.g. https://example.com',
      type: 'string',
      coerce: coerceUrl,
    },
    fromHandle: {
      alias: 'fH',
      desc: 'The source handle, e.g. to-migrate.bsky.social',
      type: 'string',
    },
    toHandle: {
      alias: 'tH',
      desc: 'The destination handle, e.g. migrated.example.com',
      type: 'string',
    },
    fromPassword: {
      alias: 'fP',
      desc: 'The source account password',
      type: 'string',
    },
    toPassword: {
      alias: 'tP',
      desc: 'The destination account password',
      type: 'string',
    },
    toEmail: {
      alias: 'e',
      desc: 'The destination account email, e.g. foo@example.com',
      type: 'string',
    },
    inviteCode: {
      alias: 'i',
      desc: 'The destination account invite code',
      type: 'string',
    },
  }) as const;

type RawBuilders = ReturnType<typeof makeRawBuilders>;
type Builders = RawBuilders & Record<keyof RawBuilders, Options>;

export const makeBuilders = makeRawBuilders as () => Builders;
