import { defineConfig, globalIgnores } from 'eslint/config';

import drizzle from 'eslint-plugin-drizzle';
import javascript from '@eslint/js';
import nextTs from 'eslint-config-next/typescript';
import nextVitals from 'eslint-config-next/core-web-vitals';
import perfectionist from 'eslint-plugin-perfectionist';
import prettyImport from '@kamiya4047/eslint-plugin-pretty-import';
import stylistic from '@stylistic/eslint-plugin';
import tailwindcss from 'eslint-plugin-better-tailwindcss';
import typescript from 'typescript-eslint';

export default defineConfig(
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // shadcn component files
    'src/components/ui/**',
    // file generated thru `bun run auth:generate`
    'src/server/database/schema/auth.ts',
  ]),
  {
    languageOptions: {
      parser: typescript.parser,
      parserOptions: {
        projectService: true,
      },
    },
    name: 'parser',
  },
  javascript.configs.recommended,
  typescript.configs.strictTypeChecked,
  typescript.configs.stylisticTypeChecked,
  stylistic.configs.customize({
    arrowParens: true,
    semi: true,
    severity: 'warn',
  }),
  prettyImport.configs.warn,
  perfectionist.configs['recommended-alphabetical'],
  {
    plugins: {
      drizzle,
    },
    rules: {
      'drizzle/enforce-delete-with-where': [
        'error',
        { drizzleObjectName: ['db', 'ctx.db'] },
      ],
      'drizzle/enforce-update-with-where': [
        'error',
        { drizzleObjectName: ['db', 'ctx.db'] },
      ],
    },
  },
  {
    extends: [tailwindcss.configs['recommended-warn']],
    name: 'tailwind',
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/globals.css',
      },
    },
  },
  {
    name: 'overrides',
    rules: {
      '@next/next/no-img-element': 'off',
      '@stylistic/max-len': ['warn', {
        code: 120,
        ignorePattern: '^import.+',
        ignoreUrls: true,
      }],
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-named-imports': 'off',
    },
  },
);
