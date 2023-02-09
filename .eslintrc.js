module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    jest: true,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'prettier',
    'jest',
    'jest-extended',
  ],
  extends: [
    'airbnb-typescript/base',
    'prettier',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:jest-extended/all',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/lines-between-class-members': [
      'warn',
      'always',
      {
        exceptAfterSingleLine: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': 'error',
  },
  overrides: [
    {
      files: [
        '.bin/**/*',
        '**/*.spec.{js,ts}',
        '*.d.ts',
        '**/__mocks__/**',
        '**/__tests__/**',
        '**/__fixtures__/**',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'no-underscore-dangle': 'off',
        'no-console': 'off',
      },
    },
    {
      files: ['**/*.spec.{js,ts}'],
      rules: {
        '@typescript-eslint/no-var-requires': 'warn',
      },
    },
  ],
};
