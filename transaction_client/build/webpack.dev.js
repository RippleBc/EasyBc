const merge = require('webpack-merge')
const webpackConfig = require('./webpack.config')
const webpack = require('webpack')
module.exports = merge(webpackConfig, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  module: {
    rules: [{
        test: /\.(css|scss|sass)$/,
        use: [
          {
            // Adds CSS to the DOM by injecting a <style> tag
            loader: 'style-loader'
          },
          {
            // interprets @import and url() like import/require() and will resolve them
            loader: 'css-loader',
            options: {
              importLoaders: 2
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader'
          },
          {
            loader: 'postcss-loader'
          }
        ]
      },
    ]
  },
})