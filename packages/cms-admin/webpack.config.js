var path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const env = dotenv.config().parsed;

// reduce it to a nice object, the same as before
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

console.log('path to plugin: ', path.join(__dirname, './packages/cloudinary-image-plugin'));

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js',
  },
  plugins: [
    new webpack.DefinePlugin(envKeys),
    new webpack.ProvidePlugin({ BrowserFS: 'bfsGlobal', process: 'processGlobal', Buffer: 'bufferGlobal' }),
  ],
  module: {
    // REQUIRED to avoid issue "Uncaught TypeError: BrowserFS.BFSRequire is not a function"
    // See: https://github.com/jvilk/BrowserFS/issues/201
    noParse: /browserfs\.js/,
    
    rules: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        query: {
          plugins: ['transform-runtime'],
          presets: ['es2015', 'react', 'stage-0'] // <--- here
      }
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
          '^/api': '',
        },
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
      fs: 'browserfs/dist/shims/fs.js',
      buffer: 'browserfs/dist/shims/buffer.js',
      path: 'browserfs/dist/shims/path.js',
      processGlobal: 'browserfs/dist/shims/process.js',
      bufferGlobal: 'browserfs/dist/shims/bufferGlobal.js',
      bfsGlobal: require.resolve('browserfs'),
      'cloudinary-image-plugin': path.join(__dirname, './packages/cloudinary-image-plugin/dist/index.js'),
    },
  },
  node: {
    fs: 'empty',
    process: false,
    Buffer: false,
  },
};
