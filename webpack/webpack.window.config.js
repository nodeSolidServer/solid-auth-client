/* Browser bundle that exposes solid-auth-client as window.solid.auth */

const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
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
  resolve: {
    fallback: {
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/")
    }
  },
  target: false,
  plugins: [new CleanWebpackPlugin()],
  devtool
}
