module.exports = {
  apps : [{
    name: 'fullConsensus',
    script: 'consensus_full_server/index.js',
    args: '',
    instances: 1,
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
    log_type: 'json',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  },{
    name: 'lightConsensus',
    script: 'consensus_light_server/index.js',
    args: '',
    instances: "max",
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
    log_type: 'json',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  },{
    name: 'logParser',
    script: 'log_Parser/index.js',
    args: '',
    instances: 1,
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
    log_type: 'json',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }, {
    name: 'monitor',
    script: 'monitor_server/index.js',
    args: '',
    instances: "max",
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
    log_type: 'json',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
