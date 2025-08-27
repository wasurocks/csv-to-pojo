const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const publicPath = process.env.GITHUB_PAGES ? '/csv-to-pojo-1/' : '/';

  return {
    entry: './src/index.ts',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: isProduction ? publicPath : '/',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        title: 'CSV to POJO Generator',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/.nojekyll', to: '.nojekyll', noErrorOnMissing: true }
        ]
      }),
    ],
    devServer: {
      static: './dist',
      port: 3000,
      open: true,
    },
  };
};