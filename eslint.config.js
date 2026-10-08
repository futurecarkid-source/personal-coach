const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'node_modules/*'] },
  { files: ['jest.setup.js'], languageOptions: { globals: { jest: 'readonly' } } },
]);
