const path = require('path')
const HtmlWebpackplugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
    // 指定打包模式
    mode: 'development',
    entry: [
        // Babel默认只转换新的JavaScript句法（syntax），而不转换新的API.
        // 比如Iterator、Generator、Set、Maps、Proxy、Reflect、Symbol、Promise等全局对象，
        // 以及一些定义在全局对象上的方法（比如Object.assign）都不会转码.
        // 举例来说，ES6在Array对象上新增了Array.from方法, Babel就不会转码这个方法.
        // 如果想让这个方法运行，必须使用babel-polyfill，为当前环境提供一个垫片。
        "babel-polyfill",
        path.resolve(__dirname, '../src/main.js')
    ],
    output: {
        // 配置打包文件输出的目录
        path: path.resolve(__dirname, '../../transaction_server/dist'),
        // 生成的js文件名称
        filename: 'js/[name].[hash:8].js',
        // 生成的chunk名称
        chunkFilename: 'js/[name].[hash:8].js'
    },
    devServer: { 
        contentBase: path.resolve(__dirname, '../dist'),
        compress: true,
        hot: true,
        port: 8080,
        proxy: {
            '/': {
                target: 'http://127.0.0.1:8082/',
                changeOrigin: true,
                ws: false,
                pathRewrite: {
                    '^/': '/',
                },
            }
        }
    },
    module: {
        rules: [
            {   // 将js或者jsx文件编译为es5
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['syntax-dynamic-import']
                    }
                }]
            },
            {
                // 编译vue模版
                test: /\.vue$/,
                use: [{
                    loader: 'cache-loader'
                },
                {
                    loader: 'thread-loader'
                },
                {
                    loader: 'vue-loader'
                }]
            },
            {
                // 将资源文件编码为hash字符串
                test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                }]
            }
        ]
    },
    plugins:[
        new VueLoaderPlugin(),
        new HtmlWebpackplugin({
            filename: 'index.html', // 打包后的文件名，默认是index.html   
            template: path.resolve(__dirname, '../index.html') // 导入被打包的文件模板
        })
    ]
}