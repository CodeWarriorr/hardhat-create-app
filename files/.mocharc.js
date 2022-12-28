'use strict';
process.env.TS_NODE_FILES = true;
module.exports = {
  'allow-uncaught': true,
  diff: true,
  extension: ['ts', 'js'],
  recursive: true,
  reporter: 'spec',
  require: ['ts-node/register', 'hardhat/register'],
  slow: 300,
  spec: ['test/**/*.test.ts', 'test/**/*.test.js'],
  timeout: 0,
  ui: 'bdd',
  watch: false,
  'watch-files': ['contracts/**/*.sol', 'test/**/*.ts', 'test/**/*.js'],
};
