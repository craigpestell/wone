module.exports = {
  apps: [
    {
      name: 'Posts Admin (CMS)',
      script: './runner.sh',
      exec_interpreter: 'bash',
      "exec_mode" : "fork_mode",
      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],

  deploy: {
    development: {
      user: 'repn',
      host: 'kali-dev',
      ref: 'origin/master',
      repo: 'git@github.com:craigpestell/kali-posts-admin.git',
      path: '/home/repn/workspace/kali-posts-admin',
      'post-deploy': 'npm install && pm2 startOrReload ecosystem.config.js --env development',
    },
    production: {
      user: 'node',
      host: '212.83.163.1',
      ref: 'origin/master',
      repo: 'git@github.com:repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
    },
  },
};
