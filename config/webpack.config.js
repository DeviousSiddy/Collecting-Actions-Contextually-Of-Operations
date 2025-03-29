'use strict';

const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const PATHS = require('./paths');

module.exports = merge(common, {
  mode: 'production',
  entry: {
    background: path.join(PATHS.src, 'background.js'),
    contentScript: path.join(PATHS.src, 'contentScript.js'),
    popup: path.join(PATHS.src, 'popup.js'),
  },
  output: {
    path: PATHS.build, // Output to the `build` folder
    filename: '[name].js', // Output files named based on entry keys
  },
});
