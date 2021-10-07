module.exports = {
  apps: [
    {
      name: 'TOHL_API',
      script: 'server/index.js',
      output: './.pm2/out.log',
      error: './.pm2/error.log',
      log: './.pm2/combined.outerr.log'
    },
    {
      name: 'TOHL_UPDATER',
      script: 'index.js',
      output: './.pm2/updater-out.log',
      error: './.pm2/updater-error.log',
      log: './.pm2/updater-combined.outerr.log'
    }
  ]
}
