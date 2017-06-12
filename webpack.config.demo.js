const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './demo/index.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'docs')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /^.*\/oidc-rp\/.*\.js$/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  },
  externals: {
    'node-fetch': 'fetch',
    'text-encoding': 'TextEncoder',
    'urlutils': 'URL',
    '@trust/webcrypto': 'crypto'
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Solid Auth Client',
      hash: true
    }),
    new webpack.optimize.UglifyJsPlugin()
  ],
  devServer: {
    contentBase: path.join(__dirname, 'docs'),
    historyApiFallback: true
  },
  devtool: 'cheap-eval-source-map'
}
