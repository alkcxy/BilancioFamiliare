const { generateWebpackConfig, merge } = require('shakapacker')
const webpack = require('webpack')

const webpackConfig = generateWebpackConfig()

const customConfig = {
  module: {
    rules: [
      {
        test: require.resolve('jquery'),
        loader: 'expose-loader',
        options: {
          exposes: ['$', 'jQuery'],
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default']
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.scss', '.css']
  }
}

module.exports = merge(webpackConfig, customConfig)
