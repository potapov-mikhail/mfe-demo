const { dependencies } = require('./package.json');

// Keep this list aligned with plain-host/src/app/federation.ts.
// Explicit entries avoid sharing unrelated packages and secondary entrypoints.
const packages = ['@angular/core', '@angular/common', '@angular/router', '@angular/platform-browser', 'rxjs'];
module.exports = () => Object.fromEntries(packages.map(name => [name, {
  singleton: true,
  strictVersion: true,
  requiredVersion: dependencies[name],
}]));
