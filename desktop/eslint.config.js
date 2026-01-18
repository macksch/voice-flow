const globals = require('globals');
const pluginJs = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
    {
        ignores: ['dist/**', 'out/**', 'node_modules/**', '**/*.min.js', 'assets/**']
    },
    pluginJs.configs.recommended,
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                ...globals.browser,
                ...globals.node,
                electron: 'readonly',
                // Vitest globals
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'no-undef': 'warn'
        }
    },
    eslintConfigPrettier,
    {
        files: ['tests/**/*.js', 'tests/**/*.ts'],
        languageOptions: {
            sourceType: 'module'
        }
    }
];
