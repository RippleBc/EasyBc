module.exports = {
  apps : [{
    name: 'fullConsensus',
    script: 'consensus_full_server/index.js',
    args: '',
    node_args: '--abort-on-uncaught-exception',
    instances: 1,
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }, {
    name: 'p2pProxyServer',
    script: 'p2p_proxy_server/index.js',
    args: '',
    node_args: '--abort-on-uncaught-exception',
    instances: 1,
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
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
    node_args: '--abort-on-uncaught-exception',
    instances: 1,
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  },{
    name: 'consensusLogParser',
    script: 'consensus_log_parser/index.js',
    args: '',
    node_args: '--abort-on-uncaught-exception',
    instances: 1,
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  },{
    name: 'transactionParser',
    script: 'consensus_transaction_parser/index.js',
    args: '',
    node_args: '--abort-on-uncaught-exception',
    instances: 1,
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    output: '/dev/null',
    error: '/dev/null',
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
