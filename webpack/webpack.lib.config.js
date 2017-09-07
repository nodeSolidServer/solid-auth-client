const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const {
  context,
  module: _module,
  externals,
  devtool
} = require('./webpack.common.config')

const outputDir = './dist-lib'

module.exports = {
  context,
  entry: {
    'solid-auth-client': './src/index.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(outputDir),
    library: 'SolidAuthClient',
    libraryTarget: 'umd'
  },
  module: _module,
  externals,
  plugins: [new CleanWebpackPlugin([outputDir])],
  devtool
}
