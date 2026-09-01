const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch packages directory in monorepo for shared code
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, 'packages'),
];

// Let Metro know where to resolve packages in monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

const mobileNodeModules = path.resolve(projectRoot, 'node_modules');

// Force react, react-native, scheduler and their subpaths to resolve from local mobile node_modules.
// Without this, Metro's file-map incorrectly resolves 'react' to @types/react,
// or resolves subpaths like 'react/jsx-dev-runtime' to root React 19 node_modules,
// causing runtime crashes from React 18/19 internal mismatch (recentlyCreatedOwnerStacks error).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName.startsWith('react/') ||
    moduleName === 'react-native' ||
    moduleName.startsWith('react-native/') ||
    moduleName === 'scheduler' ||
    moduleName.startsWith('scheduler/')
  ) {
    try {
      const resolved = require.resolve(moduleName, { paths: [mobileNodeModules] });
      return { type: 'sourceFile', filePath: resolved };
    } catch {
      // Fallback to standard resolution if not found locally
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
