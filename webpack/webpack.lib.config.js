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
    'solid-auth-client': './src/index.js'
  },
  output: Object.assign({}, output, {
    library: 'SolidAuthClient',
    libraryTarget: 'umd'
  }),
  module: _module,
  externals,
  plugins,
  devtool
}
