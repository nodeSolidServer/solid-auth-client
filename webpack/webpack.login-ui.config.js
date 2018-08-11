const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const path = require('path')
const { EnvironmentPlugin } = require('webpack')

const {
  context,
  mode,
  module: _module,
  externals
} = require('./webpack.common.config')

const outputDir = './dist-ui'

module.exports = {
  context,
  mode,
  entry: {
    login: './login-ui/index.js'
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
    new EnvironmentPlugin({
      'APP_NAME': '',
    }),
    new CleanWebpackPlugin([outputDir]),
    new HtmlWebpackPlugin({
      template: 'login-ui/index.ejs',
      filename: 'login.html',
      inlineSource: '.(js|css)$'
    }),
    new HtmlWebpackInlineSourcePlugin()
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  }
}
