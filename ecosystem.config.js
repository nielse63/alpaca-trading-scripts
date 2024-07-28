module.exports = {
  apps: [
    {
      name: 'crypto',
      script: 'dist/crypto/cron.js',
      instances: 1,
      watch: ['dist'],
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'server',
      script: 'app/bin/www',
      env: {
        NODE_ENV: 'production',
        DEBUG: '*',
      },
    },
  ],
};
