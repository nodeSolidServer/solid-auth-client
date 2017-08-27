const CleanWebpackPlugin = require('clean-webpack-plugin')
const DotenvPlugin = require('dotenv-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const path = require('path')
const webpack = require('webpack')

const {
  module: _module,
  externals,
  devtool
} = require('./webpack.common.config')

const outputDir = path.resolve('./dist-popup')

module.exports = {
  entry: {
    idpSelect: './popup-app/idp-select.js',
    idpCallback: './popup-app/idp-callback.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: outputDir
  },
  module: _module,
  externals,
  plugins: [
    new DotenvPlugin({
      path: './.env.popup',
      safe: './.env.popup.example'
    }),
    new CleanWebpackPlugin([outputDir]),
    new HtmlWebpackPlugin({
      chunks: ['idpSelect'],
      template: 'popup-app/idp-select.ejs',
      filename: 'idp-select.html',
      inlineSource: '.(js|css)$'
    }),
    new HtmlWebpackPlugin({
      chunks: ['idpCallback'],
      template: 'popup-app/idp-callback.ejs',
      filename: 'idp-callback.html',
      inlineSource: '.(js|css)$'
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new webpack.HotModuleReplacementPlugin(outputDir)
  ],
  devtool,
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  }
}
