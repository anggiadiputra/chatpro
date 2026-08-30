import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      'no-console': 'warn',
      'no-await-in-loop': 'warn',
      'no-duplicate-imports': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
      // React Compiler-era rules (eslint-plugin-react-hooks v7) are too aggressive
      // for this pre-compiler codebase; keep them as warnings, not errors.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      // Legacy code style; warn instead of fail the build.
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
])

export default eslintConfig
