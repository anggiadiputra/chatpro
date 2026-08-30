module.exports = {
  apps: [{
    name: 'whoops-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3006',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3006
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
