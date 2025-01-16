import { makeMockCredentials } from '../utils.js';

export const validateString = (value: string) =>
  value.length > 0 || 'Must be a non-empty string';

export const getCredentialsInteractive = async () => makeMockCredentials();
