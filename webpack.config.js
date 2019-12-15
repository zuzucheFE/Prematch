module.exports = {
    entry: {
        index: './src'
    },
    output: {
        filename: 'index.js',
        path: __dirname + '/dist',
        libraryTarget: "umd"
    },
    resolve: {
        alias: {
            src: __dirname + '/src',
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    externals: {
		react: 'react'
	}
};