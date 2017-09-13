const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const path = require('path')
const { EnvironmentPlugin } = require('webpack')

const {
  context,
  module: _module,
  externals
} = require('./webpack.common.config')

const outputDir = './dist-popup'

module.exports = {
  context,
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
    new EnvironmentPlugin(['APP_NAME']),
    new CleanWebpackPlugin([outputDir]),
    new HtmlWebpackPlugin({
      template: 'popup-app/index.ejs',
      filename: 'popup.html',
      inlineSource: '.(js|css)$'
    }),
    new HtmlWebpackInlineSourcePlugin()
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  }
}
