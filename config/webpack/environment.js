const { environment } = require('@rails/webpacker')
const coffee =  require('./loaders/coffee')
const webpack = require('webpack');
// Add an additional plugin of your choosing : ProvidePlugin
environment.plugins.prepend(
  'Provide',
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    Popper: ['popper.js', 'default'],
    Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown",
    Util: "exports-loader?Util!bootstrap/js/dist/util",
  })
);

environment.loaders.append('coffee', coffee)
module.exports = environment
