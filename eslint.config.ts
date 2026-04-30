import { defineConfig, globalIgnores } from 'eslint/config';

import parser from '@typescript-eslint/parser';
import prettyImport from '@kamiya4047/eslint-plugin-pretty-import';

export default defineConfig(
  {
    name: 'files',
    files: [
      '**/*.{ts,tsx}',
    ]
  },
  {
    languageOptions: {
      parser: parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    name: 'parser',
  },
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
  prettyImport.configs.error,
)
