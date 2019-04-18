module.exports = {
  outputDir: '../transaction_server/dist',
  devServer: {
    proxy: {
      '/': {
        target: 'http://127.0.0.1:8082/',
        changeOrigin: true,
        ws: false,
        pathRewrite: {
          '^/': '/',
        },
      },
    },
  },
}
