/**
 * Based on the referenced sources, the front portion of a Bluesky handle
 * must:
 * - Be a lowercase string consisting of alphanumerical characters and hyphens
 * - Start with a letter
 * - Be between 3 and 18 characters long
 * - Not start or end with a hyphen
 *
 * Refs:
 * - https://github.com/bluesky-social/social-app/blob/704e36c2801c4c06a3763eaef90c6a3e532a326d/src/lib/strings/handles.ts#L41
 * - https://github.com/bluesky-social/atproto/blob/a940c3fceff7a03e434b12b4dc9ce71ceb3bb419/packages/pds/src/handle/index.ts
 */
export const isValidHandle = (value: string): boolean =>
  /^[a-z][a-z0-9-]{1,16}[a-z0-9]$/u.test(value);
