// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  sonarjs.configs.recommended,
  unicorn.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // --- Existing rules ---
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // --- Unicorn: disable overly strict rules for NestJS ---
      'unicorn/prevent-abbreviations': 'off', // req, res, dto, etc. are fine
      'unicorn/no-null': 'off', // Drizzle ORM uses null
      'unicorn/filename-case': 'off', // NestJS kebab-case handled by convention
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-module': 'off', // NestJS uses both CJS and ESM
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/consistent-function-scoping': 'off', // NestJS services use inner functions legitimately
      'sonarjs/void-use': 'off',                    // void is used intentionally in NestJS async patterns
      'sonarjs/cognitive-complexity': ['warn', 20], // Increase limit for complex business logic

      // --- Built-in complexity / size limits ---
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
      'complexity': ['warn', 15],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 5],
    },
  },
  // Prettier must be last to override any formatting conflicts
  eslintPluginPrettierRecommended,
);
