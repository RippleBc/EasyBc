const path = require('path')
const HtmlWebpackplugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    // 指定打包模式
    mode: 'development',
    entry: {
        // 配置入口文件
        main: path.resolve(__dirname, '../src/main.js')
    },
    output: {
        // 配置打包文件输出的目录
        path: path.resolve(__dirname, '../dist'),
        // 生成的js文件名称
        filename: 'js/[name].[hash:8].js',
        // 生成的chunk名称
        chunkFilename: 'js/[name].[hash:8].js',
        // 资源引用路径
        publicPath: "/dist/"
    },
    devServer: { 
        contentBase: path.resolve(__dirname, '../dist'),
        compress: true,
        hot: true,
        port: 8088
    },
    module: {
        rules: [
            {   // 将js或者jsx文件编译为es5
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets:['@babel/preset-env']
                    }
                }
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