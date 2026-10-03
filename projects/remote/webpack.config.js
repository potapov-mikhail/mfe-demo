const { withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const shared = require('../../federation.shared');
module.exports = withModuleFederationPlugin({
  name: 'remote',
  library: { type: 'var', name: 'remote' },
  exposes: {
    './Routes': './projects/remote/src/app/remote.routes.ts',
    './Component': './projects/remote/src/app/remote-widget.ts',
  },
  shared: shared(),
});
// Angular's Webpack builder defaults to module scripts. A global container
// must be a classic script so window.remote is available to both loaders.
Object.assign(module.exports.output, { uniqueName: 'remote', module: false, scriptType: 'text/javascript' });
module.exports.experiments = { outputModule: false };
module.exports.devServer = { headers: { 'Access-Control-Allow-Origin': '*' } };
