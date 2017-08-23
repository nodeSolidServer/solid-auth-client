const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const path = require('path')
const webpack = require('webpack')

const {
  output,
  module: _module,
  externals,
  plugins,
  devtool
} = require('./common')

module.exports = {
  entry: {
    idpSelect: './popup-app/idp-select.js',
    idpCallback: './popup-app/idp-callback.js'
  },
  output,
  module: _module,
  externals,
  plugins: [
    ...plugins,
    new webpack.DefinePlugin({
      'process.env.TRUSTED_APP_ORIGIN': "'http://localhost:8081'"
    }),
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
    new HtmlWebpackInlineSourcePlugin()
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  }
}
