// eslint-disable-next-line @typescript-eslint/no-var-requires
const { override, fixBabelImports, addLessLoader, addWebpackModuleRule } = require('customize-cra')

/* eslint-env commonjs */
module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: true,
  }),
  addLessLoader({
    javascriptEnabled: true,
    modifyVars: { '@primary-color': '#e53f67' },
  }),
  addWebpackModuleRule({ test: /\.worker\.{ts|js}$/, use: { loader: 'worker-loader' } }),
)
