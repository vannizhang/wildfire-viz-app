// webpack v4
// const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports =  (env, options)=> {

    const devMode = options.mode === 'development' ? true : false;

    return {
        output: {
            filename: 'bundle.[hash].js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                    loader: "babel-loader"
                    }
                },
                {
                    test: /\.s?[ac]ss$/,
                    use: [
                        devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader", options: {
                                sourceMap: true
                            }
                        }, {
                            loader: "sass-loader", options: {
                                sourceMap: true
                            }
                        }
                    ]
                },
                { test: /\.woff$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
                { test: /\.ttf$/,  loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
                { test: /\.eot$/,  loader: "file-loader" },
                { test: /\.svg$/,  loader: "url-loader?limit=10000&mimetype=image/svg+xml" },
                { test: /\.(png|jpg|gif)$/,  loader: "file-loader" },
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: devMode ? '[name].css' : '[name].[hash].css',
                chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
            }),
            new HtmlWebpackPlugin({
                // inject: false,
                // hash: true,
                template: './src/index.template.html',
                filename: 'index.html'
            })
        ]
    }

};