import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Code quality — built-in
      'max-lines': [
        'warn',
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'warn',
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['warn', 25], // Increased — React components are inherently complex
      'max-depth': ['warn', 4],
      'max-params': ['warn', 5],
      // Unused vars — allow _ prefix for intentionally unused destructured/param values
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // React/TypeScript false positives — disabled or relaxed
      'react-refresh/only-export-components': 'warn', // Contexts/hooks legitimately export multiple things
      'react-hooks/set-state-in-effect': 'warn', // Valid pattern when syncing state from external sources (auth, server data)
    },
  },
  // SonarJS — recommended rules
  sonarjs.configs.recommended,
  // SonarJS — React-friendly overrides (must come after recommended to take effect)
  {
    rules: {
      'sonarjs/void-use': 'off', // void operator IS valid to discard promises intentionally
      'sonarjs/no-nested-conditional': 'warn', // JSX often requires nested ternaries for conditional rendering
      'sonarjs/cognitive-complexity': ['warn', 20], // Increased — React components are inherently complex
      'sonarjs/no-nested-functions': 'off', // React hooks legitimately nest functions
    },
  },
  // Unicorn — recommended rules with React-friendly overrides
  {
    plugins: { unicorn },
    rules: {
      ...unicorn.configs.recommended.rules,
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/consistent-function-scoping': 'off', // React hooks NEED inner async functions (useCallback, event handlers)
    },
  },
  // Prettier — must come last to override formatting conflicts
  {
    plugins: { prettier },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',
    },
  },
]);
