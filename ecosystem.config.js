module.exports = {
  apps: [
    {
      name: 'crypto',
      script: 'dist/crypto/cron.js',
      instances: 1,
      // cron_restart: '*/15 * * * *',
      watch: ['dist/crypto'],
    },
  ],
};
