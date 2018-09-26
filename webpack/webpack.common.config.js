const path = require('path')

module.exports = {
  context: path.resolve(__dirname, '..'),
  mode: 'none',
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
    '@trust/webcrypto': 'crypto'
  },
  devtool: 'source-map'
}
