const path = require('path');

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'test/javascript/test_index.js'
    ],
    preprocessors: {
      'test/javascript/test_index.js': ['webpack']
    },
    webpack: {
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', { targets: "defaults" }]]
              }
            }
          },
          {
             test: /\.html$/,
             use: 'html-loader'
          }
        ]
      },
      resolve: {
        modules: [
          path.resolve(__dirname, 'app/javascript'),
          'node_modules'
        ]
      }
    },
    reporters: ['progress'],
    browsers: ['jsdom'],
    singleRun: true
  });
};
