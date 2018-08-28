const environment = require('./environment');
const clearConsole =  require('./loaders/clear-console');
environment.plugins.prepend('clearConsole', clearConsole);
module.exports = environment.toWebpackConfig();
