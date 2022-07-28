/* eslint-disable */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const {InjectManifest} = require('workbox-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

const envConfig = require('./config.json');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
let isDev = process.env.NODE_ENV === 'development';

let config = {
    entry: {
        globalReady: './src/global-ready.js',
        main:'./src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]_[contenthash].js'
    },
    mode: process.env.NODE_ENV,
    devtool: false,
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            ...envConfig,
            reactDevTools: !isDev ? '<script>if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === \'object\') {__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function() {};}</script>' : '',
            template: 'src/index.html'
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.PUBLIC_URL': '\"\"'
        }),
        new MiniCssExtractPlugin({
            filename: '[name]_[contenthash].css',
        }),
        new CopyPlugin({patterns: [{from: 'public'}]}),
        new InjectManifest({
            // These are some common options, and not all are required.
            // Consult the docs for more info.
            swSrc: './src/sw.js',
        })
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-flow', '@babel/preset-react'],
                    plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-private-methods']
                }
            },
            {
                test: /\.module\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader
                    },
                    {loader: 'css-loader', options: {modules: true, importLoaders: 1}},
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    require('postcss-preset-env')({browsers: 'last 2 versions', stage: 1}),
                                    require('autoprefixer'),
                                ]
                            }
                        }
                    }
                ]
            }
        ]
    },
    resolve: { extensions: ["*", ".js", ".jsx"] }
};

if (process.env.npm_lifecycle_event === 'analyzer') {
    config.plugins.push(new BundleAnalyzerPlugin());
}
if (isDev) {
    config.devServer = {
        static : './dist',
        proxy: {
            '/api': {
                target: 'https://mir.woostudio.ru',
                secure: false,
                changeOrigin: true,
            }
        },
    };
} else {
    config.optimization = {
        minimizer: [new TerserPlugin({extractComments: false, terserOptions: {output: {comments: false}}}), new CssMinimizerPlugin()],
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    }
}
module.exports = config;
