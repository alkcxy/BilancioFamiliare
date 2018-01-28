const environment = require('./environment');
const clearConsole =  require('./loaders/clear-console');
environment.plugins.append('clearConsole', clearConsole);
module.exports = environment.toWebpackConfig();
