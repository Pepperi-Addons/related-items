const { shareAll, share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const filename = `related_items`;

const webpackConfig = withModuleFederationPlugin({
    name: filename,
    filename: `${filename}.js`,
    exposes: {
        './WebComponents': './src/bootstrap.ts',
    },
    shared: {
        ...shareAll({ strictVersion: true, requiredVersion: 'auto' }),
    }
});

module.exports = {
    ...webpackConfig,
    output: {
        ...webpackConfig.output,
        uniqueName: filename,
    },
};

// const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
// const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;
// const { merge } = require('webpack-merge');
// // const deps = require('./package.json').dependencies;
// const webpack = require('webpack');
// // const TerserPlugin = require('terser-webpack-plugin');
// // const DynamicContainerPathPlugin = require('dynamic-container-path-webpack-plugin');
// // const setPublicPath = require('dynamic-container-path-webpack-plugin/set-path');
// module.exports = (config, options, env) => {
//       const mfConfig = {
//         output: {
//           uniqueName: "atd_editor",
//           publicPath: "auto"
//         },
//         optimization: {
//           // Only needed to bypass a temporary bug
//           runtimeChunk: false
//         },
//         plugins: [
//           // new webpack.ProvidePlugin({
//           //   process: 'process/browser',
//           // }),
//           new ModuleFederationPlugin({
//             // remotes: {},
//             name: "atd_editor",
//             filename: "atd_editor.js",
//             exposes: {
//               './AtdEditorComponent': './src/app/components/atd-editor/index.ts',
//               './AtdEditorModule': './src/app/components/atd-editor/index.ts'
//             },
//             shared: {
//               // ...deps,
//               "@angular/core": { eager:true,  singleton: true,   strictVersion: false  },
//               "@angular/common": { eager:true,  singleton: true,  strictVersion: false   },
//               "@angular/common/http": { eager:true,  singleton: true,  strictVersion: false   },
//               "@angular/material": { eager:true,  singleton: true,  strictVersion: false   },
//               "rxjs": { eager: true, singleton: true, strictVersion: false },
//               "@ngx-translate/core": { eager: true, singleton: true, strictVersion: false },
//               "@angular/router": { eager: true, singleton: true,  strictVersion: false }
//             }
//             }),
//           //   new DynamicContainerPathPlugin({
//           //     iife: setPublicPath,
//           //     entry: 'atd_config',
//           //   }),
//           ],
//         };
//       const merged = merge(config, mfConfig);
//       const singleSpaWebpackConfig = singleSpaAngularWebpack(merged, options);
//       return singleSpaWebpackConfig;


//     // Feel free to modify this webpack config however you'd like to
// };
