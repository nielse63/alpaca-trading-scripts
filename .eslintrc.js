module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2024,
  },
  plugins: ['import'],
  extends: ['eslint:recommended', 'airbnb-base', 'prettier'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: [
        '.bin/**/*',
        '**/*.spec.{js,ts}',
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
  ],
};
