import base, { createConfig } from '@metamask/eslint-config';
import nodejs from '@metamask/eslint-config-nodejs';
import typescript from '@metamask/eslint-config-typescript';
import vitest from '@metamask/eslint-config-vitest';

const config = createConfig([
  {
    ignores: ['**/dist/', 'docs/'],
  },

  {
    extends: [base, nodejs],

    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: ['./tsconfig.json'],
      },
    },

    settings: {
      'import-x/extensions': ['.js', '.mjs'],
    },

    rules: {
      'no-void': 'off',
      'prefer-template': 'off',

      'import-x/no-useless-path-segments': 'off',

      'jsdoc/require-description': 'off',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: false,
          },
        },
      ],

      'n/hashbang': [
        'error',
        {
          additionalExecutables: ['src/main.ts'],
        },
      ],
    },
  },

  {
    files: ['**/*.ts'],
    extends: [typescript],

    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-check': false,
          'ts-expect-error': false,
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/prefer-reduce-type-parameter': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  {
    files: ['**/*.cjs'],

    languageOptions: {
      sourceType: 'script',
    },
  },

  {
    files: ['**/*.test.ts', '**/*.test.js'],

    extends: [vitest],
  },
]);

export default config;
