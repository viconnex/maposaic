// eslint-disable-next-line
const CracoLessPlugin = require('craco-less')

/* eslint-env commonjs */
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
}

// module.exports = function override(config, env) {
//   const wasmExtensionRegExp = /\.wasm$/

//   config.resolve.extensions.push('.wasm')

//   config.module.rules.forEach((rule) => {
//     ;(rule.oneOf || []).forEach((oneOf) => {
//       if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
//         // Make file-loader ignore WASM files
//         oneOf.exclude.push(wasmExtensionRegExp)
//       }
//     })
//   })

//   // Add a dedicated loader for WASM
//   config.module.rules.push({
//     test: wasmExtensionRegExp,
//     include: path.resolve(__dirname, 'src'),
//     use: [{ loader: require.resolve('wasm-loader'), options: {} }],
//   })

//   return config
// }
