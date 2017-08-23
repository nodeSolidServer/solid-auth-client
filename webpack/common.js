const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
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
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  externals: {
    'node-fetch': 'fetch',
    'text-encoding': 'TextEncoder',
    urlutils: 'URL',
    '@trust/webcrypto': 'crypto'
  },
  devtool: 'source-map',
  plugins: [new CleanWebpackPlugin(['dist'])]
}
