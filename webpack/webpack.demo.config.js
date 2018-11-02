/* HTML bundle of the demo application */

const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const { EnvironmentPlugin, HotModuleReplacementPlugin } = require('webpack')
const path = require('path')

const {
  context,
  mode,
  module: _module,
  externals,
  devtool
} = require('./webpack.common.config')

const outputDir = './dist-demo'

module.exports = {
  context,
  mode,
  entry: {
    demo: './demo/index.js'
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
    new EnvironmentPlugin(['POPUP_URI']),
    new CleanWebpackPlugin([outputDir]),
    new HtmlWebpackPlugin({
      chunks: ['demo'],
      filename: 'demo.html',
      title: 'Solid Auth Client Demo'
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new HotModuleReplacementPlugin(outputDir)
  ],
  devtool,
  devServer: {
    index: 'demo.html',
    contentBase: outputDir,
    historyApiFallback: true,
    hot: true
  }
}
