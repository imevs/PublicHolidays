const parser = require('@typescript-eslint/parser');
const tseslint = require('@typescript-eslint/eslint-plugin');

module.exports = [
    {
        ignores: ['scripts/**', 'dist/**'],
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser,
            parserOptions: {
                project: ['./tsconfig.json', './tsconfig.node.json'],
                tsconfigRootDir: process.cwd(),
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            'no-unused-vars': 'off',
        },
    },
    {
        plugins: {
            'react-refresh': require('eslint-plugin-react-refresh'),
        },
        rules: {
            'react-refresh/only-export-components': [
                'warn',
                {allowConstantExport: true},
            ],
        },
    },
];
