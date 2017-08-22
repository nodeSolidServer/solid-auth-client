const path = require('path')

const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const webpack = require('webpack')

module.exports = {
  entry: {
    client: './src/index.js',
    idpSelect: './popup-app/idp-select.js',
    idpCallback: './popup-app/idp-callback.js',
    demo: './demo/index.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'SolidAuthClient',
    libraryTarget: 'umd'
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
    new CleanWebpackPlugin([ 'dist' ]),
    new HtmlWebpackPlugin({
      chunks: [ 'idpSelect' ],
      template: 'popup-app/idp-select.ejs',
      filename: 'idp-select.html',
      inlineSource: '.(js|css)$'
    }),
    new HtmlWebpackPlugin({
      chunks: [ 'idpCallback' ],
      template: 'popup-app/idp-callback.ejs',
      filename: 'idp-callback.html',
      inlineSource: '.(js|css)$'
    }),
    new HtmlWebpackPlugin({
      chunks: [ 'demo' ],
      filename: 'demo.html',
      title: 'Solid Auth Client Demo'
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new webpack.optimize.UglifyJsPlugin({ sourceMap: true })
  ],
  devtool: 'source-map',
  devServer: {
    index: 'demo.html',
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true
  }
}
