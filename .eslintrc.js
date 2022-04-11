module.exports = {
  root: true,
  plugins: ['jest'],
  extends: ['airbnb-base', 'prettier', 'plugin:jest/recommended'],
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
};
