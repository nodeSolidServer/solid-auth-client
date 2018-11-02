/* Browser bundle that exposes solid-auth-client as window.solid.auth */

const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const {
  context,
  mode,
  entry,
  module: _module,
  externals,
  devtool
} = require('./webpack.common.config')

const outputDir = './dist-lib'

module.exports = {
  context,
  mode,
  entry,
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(outputDir),
    libraryExport: 'default',
    library: ['solid', 'auth'],
    libraryTarget: 'umd'
  },
  module: _module,
  externals,
  plugins: [new CleanWebpackPlugin([outputDir])],
  devtool
}
