const { environment } = require('@rails/webpacker');
const coffee =  require('./loaders/coffee');
const jshint =  require('./loaders/jshint');
const webpack = require('webpack');
// Add an additional plugin of your choosing : ProvidePlugin
environment.plugins.prepend(
  'Provide',
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    Popper: ['popper.js', 'default'],
    Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown",
    Tooltip: "exports-loader?Tooltip!bootstrap/js/dist/tooltip",
    Popover: "exports-loader?Popover!bootstrap/js/dist/popover",
    Util: "exports-loader?Util!bootstrap/js/dist/util"
  })
);

//environment.loaders.prepend('jshint', jshint);
environment.loaders.append('coffee', coffee);
module.exports = environment;
