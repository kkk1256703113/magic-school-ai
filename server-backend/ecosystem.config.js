module.exports = {
  apps: [{
    // 应用名称
    name: 'magic-school-api',
    
    // 入口文件
    script: './server.js',
    
    // 实例数量（1表示单实例，'max'表示CPU核心数）
    instances: 1,
    
    // 自动重启
    autorestart: true,
    
    // 监视文件变化（生产环境设为false）
    watch: false,
    
    // 忽略监视的文件
    ignore_watch: ['node_modules', 'logs', '.git'],
    
    // 最大内存限制
    max_memory_restart: '1G',
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'eduvisualizer_db',
      DB_USER: 'eduvisualizer_user',
      DB_PASS: 'EduViz2025Secure'
    },
    
    // 开发环境变量
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'eduvisualizer_db',
      DB_USER: 'eduvisualizer_user',
      DB_PASS: 'EduViz2025Secure'
    },
    
    // 日志配置
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // 合并日志
    merge_logs: true,
    
    // 日志日期格式
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 进程名称格式
    name_prefix: 'MS-',
    
    // 崩溃重启延迟
    min_uptime: '10s',
    
    // 最大重启次数
    max_restarts: 10,
    
    // 重启延迟
    restart_delay: 4000,
    
    // 优雅关闭超时
    kill_timeout: 5000,
    
    // 监听超时
    listen_timeout: 3000,
    
    // 执行模式
    exec_mode: 'fork',
    
    // 崩溃后的等待时间
    wait_ready: false,
    
    // 自动删除旧日志
    log_type: 'json',
    
    // CPU亲和性
    // instance_var: 'INSTANCE_ID',
    
    // 额外的节点参数
    node_args: '--max-old-space-size=1024',
    
    // 解释器参数
    interpreter_args: '',
    
    // 工作目录
    cwd: './',
    
    // 输出限制
    max_line_length: 1000,
    
    // 启动时的消息
    post_update: ['echo "应用已更新并重启"'],
    
    // 进程间通信
    // ipc: true,
  }],

  // 部署配置
  deploy: {
    production: {
      user: 'root',
      host: '45.77.86.20',
      ref: 'origin/master',
      repo: 'git@github.com:your-repo/magic-school-api.git',
      path: '/opt/magic-school-api',
      'pre-deploy': 'git pull',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};