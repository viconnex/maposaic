// eslint-disable-next-line
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const path = require('path')
const CracoLessPlugin = require('craco-less')

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': '#e53f67' },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
  webpack: {
    // plugins: [new BundleAnalyzerPlugin()],
    configure: function override(config, env) {
      const wasmExtensionRegExp = /\.wasm$/

      config.resolve.extensions.push('.wasm')

      config.module.rules.forEach((rule) => {
        ;(rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
            // make file-loader ignore WASM files
            oneOf.exclude.push(wasmExtensionRegExp)
          }
        })
      })

      // add a dedicated loader for WASM
      config.module.rules.push({
        test: wasmExtensionRegExp,
        include: path.resolve(__dirname, 'src'),
        use: [{ loader: require.resolve('wasm-loader'), options: {} }],
      })

      return config
    },
  },
}
