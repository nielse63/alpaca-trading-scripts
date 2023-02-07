module.exports = (api) => {
  api.cache(true);

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: 'maintained node versions',
        },
      ],
      '@babel/preset-typescript',
    ],
    env: {
      build: {
        ignore: [
          '**/*.spec.js',
          '**/*.spec.ts',
          '**/__tests__/**',
          '**/__mocks__/**',
        ],
      },
    },
    ignore: ['node_modules'],
  };
};
