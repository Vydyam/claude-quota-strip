const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/service-worker': './extension/background/service-worker.js',
    'content/content-script': './extension/content/content-script.js',
    'content/injector': './extension/content/injector.js',
    'popup/popup': './extension/popup/popup.js',
    'panel/panel': './extension/panel/panel.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'extension/manifest.json', to: 'manifest.json' },
        { from: 'extension/popup/popup.html', to: 'popup/popup.html' },
        { from: 'extension/popup/popup.css', to: 'popup/popup.css' },
        { from: 'extension/panel/panel.html', to: 'panel/panel.html' },
        { from: 'extension/icons', to: 'icons', noErrorOnMissing: true },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
  },
};