// Adapted from:
// https://github.com/bluesky-social/social-app/blob/704e36c2801c4c06a3763eaef90c6a3e532a326d/src/lib/strings/handles.ts#L5
//
// The RegEx is modified to match the behavior of the Bluesky app and PDS implementation,
// both of which enforce a 3-character minimum for the leftmost handle segment.
const VALIDATE_REGEX =
  /^([a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.)+([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/iu;

/**
 * Based on the referenced sources, Bluesky handles are case-sensitive,
 * and each segment of a handle must:
 * - Be a string of alphanumerical characters and hyphens
 * - Be between 1 and 63 characters long, inclusive
 * - Not start or end with a hyphen
 * In addition, the leftmost segment must be at least 3 characters long. This is enforced
 * by both the Bluesky app and the PDS.
 *
 * Refs:
 * - https://github.com/bluesky-social/social-app/blob/704e36c2801c4c06a3763eaef90c6a3e532a326d/src/lib/strings/handles.ts#L41
 * - https://github.com/bluesky-social/atproto/blob/a940c3fceff7a03e434b12b4dc9ce71ceb3bb419/packages/pds/src/handle/index.ts
 *
 * @param value - The value to validate.
 * @returns Whether the value is a valid handle.
 */
export const isHandle = (value: string): boolean => VALIDATE_REGEX.test(value);
