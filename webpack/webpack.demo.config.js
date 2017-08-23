const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const webpack = require('webpack')
const path = require('path')

const {
  output,
  module: _module,
  externals,
  plugins,
  devtool
} = require('./common')

module.exports = {
  entry: {
    demo: './demo/index.js'
  },
  output,
  module: _module,
  externals,
  plugins: [
    ...plugins,
    new HtmlWebpackPlugin({
      chunks: ['demo'],
      filename: 'demo.html',
      title: 'Solid Auth Client Demo'
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  devtool,
  devServer: {
    index: 'demo.html',
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true,
    hot: true
  }
}
