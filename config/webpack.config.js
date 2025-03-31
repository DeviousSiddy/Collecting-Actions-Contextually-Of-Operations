'use strict';

const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const PATHS = require('./paths');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
  devtool: 'source-map', // Enable source maps
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/injectedScript.js', to: 'injectedScript.js' }, // Copy injectedScript.js
        { from: 'public', to: '.' }, // Copy other static files (e.g., icons, manifest.json)
      ],
    }),
  ],
});
