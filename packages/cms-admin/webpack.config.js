var path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const env = dotenv.config().parsed;

// reduce it to a nice object, the same as before
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js',
  },
  plugins: [new webpack.DefinePlugin(envKeys)],
  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff',
      },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
    ],
  },
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    // host: "10.134.3.94",
    host: process.env.HOSTNAME,
    contentBase: path.join(__dirname, 'public'),
    historyApiFallback: true,
    proxy: {
      '/api/*': {
        target: 'http://localhost:' + process.env.PROXY_PORT_API,
        changeOrigin: true,
        pathRewrite: {
        '^/api': ''
        }
      },
    },
    quiet: false,
    noInfo: false,
    stats: {
      // Config for minimal console.log mess.
      assets: false,
      colors: true,
      version: false,
      hash: false,
      timings: false,
      chunks: false,
      chunkModules: false,
    },
  },
  resolve: {
    alias: {
      'slate-drop-or-paste-images': path.resolve(__dirname, 'packages/slate-drop-or-paste-images'),
    },
  },
  node: {
    fs: 'empty',
  },
};
