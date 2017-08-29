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

const outputDir = './dist-popup'

const dotEnvPlugin = new DotenvPlugin({
  path: './.env.popup',
  safe: './.env.popup.example'
})

module.exports = {
  entry: {
    popup: './popup-app/index.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(outputDir)
  },
  module: _module,
  externals,
  resolve: {
    alias: {
      react: 'preact-compat',
      'react-dom': 'preact-compat'
    }
  },
  plugins: [
    dotEnvPlugin,
    new CleanWebpackPlugin(['./dist-popup']),
    new HtmlWebpackPlugin({
      template: 'popup-app/index.ejs',
      filename: 'popup.html',
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
