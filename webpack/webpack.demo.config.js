const CleanWebpackPlugin = require('clean-webpack-plugin')
const DotenvPlugin = require('dotenv-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const webpack = require('webpack')
const path = require('path')

const {
  module: _module,
  externals,
  devtool
} = require('./webpack.common.config')

const outputDir = path.resolve('./docs')

module.exports = {
  entry: {
    demo: './demo/index.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: outputDir
  },
  module: _module,
  externals,
  plugins: [
    new DotenvPlugin({
      path: './.env.demo',
      safe: './.env.demo.example'
    }),
    new CleanWebpackPlugin([outputDir]),
    new HtmlWebpackPlugin({
      chunks: ['demo'],
      filename: 'demo.html',
      title: 'Solid Auth Client Demo'
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new webpack.HotModuleReplacementPlugin(outputDir)
  ],
  devtool,
  devServer: {
    index: 'demo.html',
    contentBase: outputDir,
    historyApiFallback: true,
    hot: true
  }
}
