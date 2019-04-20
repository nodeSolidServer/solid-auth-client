/* Shared webpack configuration */

const path = require('path')

module.exports = {
  context: path.resolve(__dirname, '..'),
  mode: 'none',
  entry: {
    'solid-auth-client': './src/index.js'
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
    'whatwg-url': 'window',
    'isomorphic-fetch': 'fetch',
    'solid-rest-browser': {
        root: ['../node-modules/solid-rest-browser/src','appfetch'],
        commonjs: '../node_modules/solid-rest-browser/src',
        commonjs2: '../node_modules/solid-rest-browser/src',
    },
    '@trust/webcrypto': 'crypto'
  },
  devtool: 'source-map'
}
