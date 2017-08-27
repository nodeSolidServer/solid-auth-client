const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const {
  module: _module,
  externals,
  devtool
} = require('./webpack.common.config')

const outputDir = path.resolve('./dist-lib')

module.exports = {
  entry: {
    'solid-auth-client': './src/index.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: outputDir,
    library: 'SolidAuthClient',
    libraryTarget: 'umd'
  },
  module: _module,
  externals,
  plugins: [new CleanWebpackPlugin([outputDir])],
  devtool
}
