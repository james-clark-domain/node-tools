const path = require('path');
const jsConfig = require('./jsconfig.json');

module.exports = {
  presets: [
    [ "@babel/preset-env", {
      "targets": { "node": "10" }
    }]
  ],
  plugins: [
    [
      'module-resolver', {
        root: [ path.resolve(jsConfig.compilerOptions.baseUrl) ],
      },
    ],
  ],
};
