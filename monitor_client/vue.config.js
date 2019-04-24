module.exports = {
  outputDir: '../monitor_server/dist',
  devServer: {
    proxy: {
      '/': {
        target: 'http://127.0.0.1:8083/',
        changeOrigin: true,
        ws: false,
        pathRewrite: {
          '^/': '/',
        },
      },
    },
  },
}