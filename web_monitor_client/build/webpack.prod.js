const merge = require('webpack-merge')
const webpackConfig = require('./webpack.config')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = merge(webpackConfig, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          name: 'chunk-vendors',
          test: /[\\\/]node_modules[\\\/]/,
          priority: -10,
          chunks: 'initial'
        },
        common: {
          name: 'chunk-common',
          minChunks: 2,
          priority: -20,
          chunks: 'initial',
          reuseExistingChunk: true
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.(css|scss|sass)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
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
            loader: 'postcss-loader',
            options: {
              plugins: [require('autoprefixer')]
            }
          }
        ]
      },
    ]
  },
  plugins: [
    // extracts CSS into separate files. 
    // It creates a CSS file per JS file which contains CSS. 
    // It supports On-Demand-Loading of CSS and SourceMaps.
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].css'
    }),
    // search for CSS assets during the Webpack build and minimize it with cssnano. 
    // Solves extract-text-webpack-plugin CSS duplication problem.
    new OptimizeCssnanoPlugin({
      sourceMap: true,
      cssnanoOptions: {
        preset: [
          'default',
          {
            mergeLonghand: false,
            cssDeclarationSorter: false
          }
        ]
      }
    }),
    // this plugin will remove all files inside webpack's output.path directory, 
    // as well as all unused webpack assets after every successful rebuild.
    new CleanWebpackPlugin()
  ]
})