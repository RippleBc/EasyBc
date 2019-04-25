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
      '/api':{
          target:'http://jsonplaceholder.typicode.com',
          changeOrigin:true,
          pathRewrite:{
              '/api':''
          }
      },
      '/ms':{
          target: 'https://www.easy-mock.com/mock/592501a391470c0ac1fab128',
          changeOrigin: true
      }
    },
  },
}