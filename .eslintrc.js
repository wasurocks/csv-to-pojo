module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['**/__tests__/**', '*.test.ts', 'dist/**', 'node_modules/**'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
  },
};