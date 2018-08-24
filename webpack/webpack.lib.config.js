const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const {
  context,
  mode,
  module: _module,
  externals,
  devtool
} = require('./webpack.common.config')

const outputDir = './dist-lib'

module.exports = {
  context,
  mode,
  entry: {
    'solid-auth-client': './src/index.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(outputDir),
    library: ['solid', 'auth'],
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  module: _module,
  externals,
  plugins: [new CleanWebpackPlugin([outputDir])],
  devtool
}
