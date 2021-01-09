// eslint-disable-next-line
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

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
    plugins: [new BundleAnalyzerPlugin()],
  },
}
