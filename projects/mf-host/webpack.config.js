const { withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const shared = require('../../federation.shared');
module.exports = withModuleFederationPlugin({
  name: 'mf_host',
  library: { type: 'var', name: 'mf_host' },
  shared: shared(),
});
Object.assign(module.exports.output, { uniqueName: 'mf_host', module: false, scriptType: 'text/javascript' });
module.exports.experiments = { outputModule: false };
