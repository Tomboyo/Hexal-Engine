const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'hexal-core.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'hexalCore',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src/')
    }
  }
}
