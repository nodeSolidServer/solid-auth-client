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
    idpSelect: './popup-app/idp-select.js',
    idpCallback: './popup-app/idp-callback.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(outputDir)
  },
  module: _module,
  externals,
  plugins: [
    dotEnvPlugin,
    new CleanWebpackPlugin(['./dist-popup']),
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
      inlineSource: '.(js|css)$',
      fontAwesomeUrl: dotEnvPlugin.definitions['process.env.FONT_AWESOME_URL']
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new webpack.HotModuleReplacementPlugin(outputDir)
  ],
  devtool,
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  }
}
