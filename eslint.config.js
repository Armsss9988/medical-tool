import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import boundariesPlugin from 'eslint-plugin-boundaries';

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/dist/**',
      '**/dist-app/**',
      '**/dist-electron/**',
      '**/dist-release/**',
      '**/build-app/**',
      '**/release/**',
      'node_modules/**',
      '**/scripts/**',
      '*.config.js',
      '*.config.ts',
      '*.config.cjs',
      '**/electron/**',
      '**/coverage/**'
    ]
  },
  {
    files: ['**/src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'boundaries': boundariesPlugin
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    settings: {
      react: {
        version: 'detect'
      },
      'boundaries/elements': [
        {
          type: 'domain',
          pattern: '**/src/domain/**'
        },
        {
          type: 'usecases',
          pattern: '**/src/usecases/**'
        },
        {
          type: 'infrastructure',
          pattern: '**/src/infrastructure/**'
        },
        {
          type: 'hooks',
          pattern: '**/src/hooks/**'
        },
        {
          type: 'contexts',
          pattern: '**/src/contexts/**'
        },
        {
          type: 'components',
          pattern: '**/src/components/**'
        },
        {
          type: 'data',
          pattern: '**/src/data/**'
        },
        {
          type: 'entry',
          pattern: '**/src/{App,main}.{ts,tsx}'
        },
        {
          type: 'api',
          pattern: 'apps/api/src/**'
        },
        {
          type: 'shared-schemas',
          pattern: 'packages/shared/src/schemas/**'
        }
      ]
    },
    rules: {
      // 1. TypeScript Rules
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',

      // 2. React Rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // 3. ARCHITECTURE & BOUNDARIES (Clean Architecture Layer Enforcement)
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // Domain layer: Pure business logic (Entities, Value Objects, Domain Services).
            // STRICT RULE: Domain MUST NOT depend on any outer layers.
            {
              from: { element: { type: 'domain' } },
              allow: [{ to: { element: { type: 'domain' } } }]
            },
            // Use Cases layer: Application logic.
            // Can depend on Domain, Infrastructure ports, and Seed Data.
            // CANNOT depend on UI (Components, Hooks).
            {
              from: { element: { type: 'usecases' } },
              allow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'infrastructure' } } },
                { to: { element: { type: 'data' } } },
                { to: { element: { type: 'usecases' } } }
              ]
            },
            // Infrastructure layer: Persistence, Cloud, PDF, Excel, External APIs.
            // Can depend on Domain.
            // CANNOT depend on UI (Components, Hooks) or UseCases.
            {
              from: { element: { type: 'infrastructure' } },
              allow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'infrastructure' } } },
                { to: { element: { type: 'data' } } }
              ]
            },
            // Static default data / catalogs.
            {
              from: { element: { type: 'data' } },
              allow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'data' } } }
              ]
            },
            // Contexts layer: Global and feature-level React state providers.
            // Can depend on Domain, UseCases, Infrastructure, Data, Hooks, Contexts.
            // CANNOT depend on Components or Entry.
            {
              from: { element: { type: 'contexts' } },
              allow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'usecases' } } },
                { to: { element: { type: 'infrastructure' } } },
                { to: { element: { type: 'hooks' } } },
                { to: { element: { type: 'data' } } },
                { to: { element: { type: 'contexts' } } }
              ]
            },
            // Hooks layer: React presentation controllers.
            // Can depend on Domain, UseCases, Infrastructure, Data, Hooks, Contexts.
            // CANNOT depend on Components.
            {
              from: { element: { type: 'hooks' } },
              allow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'usecases' } } },
                { to: { element: { type: 'infrastructure' } } },
                { to: { element: { type: 'data' } } },
                { to: { element: { type: 'hooks' } } },
                { to: { element: { type: 'contexts' } } }
              ]
            },
            // Components layer: Presentation UI.
            {
              from: { element: { type: 'components' } },
              allow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'usecases' } } },
                { to: { element: { type: 'infrastructure' } } },
                { to: { element: { type: 'hooks' } } },
                { to: { element: { type: 'contexts' } } },
                { to: { element: { type: 'data' } } },
                { to: { element: { type: 'components' } } }
              ]
            },
            // Entry point (App.tsx, main.tsx)
            {
              from: { element: { type: 'entry' } },
              allow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'usecases' } } },
                { to: { element: { type: 'infrastructure' } } },
                { to: { element: { type: 'hooks' } } },
                { to: { element: { type: 'contexts' } } },
                { to: { element: { type: 'data' } } },
                { to: { element: { type: 'components' } } },
                { to: { element: { type: 'entry' } } }
              ]
            },
            // API layer (Hono backend)
            {
              from: { element: { type: 'api' } },
              allow: [
                { to: { element: { type: 'api' } } },
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'shared-schemas' } } }
              ]
            },
            // Shared zod schemas
            {
              from: { element: { type: 'shared-schemas' } },
              allow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'shared-schemas' } } }
              ]
            }
          ]
        }
      ]
    }
  }
];
