const parser = require('@typescript-eslint/parser');
const tseslint = require('@typescript-eslint/eslint-plugin');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = [
    {
        ignores: ['scripts/**', 'dist/**'],
    },
    {
        files: ['**/*.{js,jsx}'],
        plugins: {
            stylistic,
        },
        rules: {
            'no-unused-vars': 'off',
            'stylistic/indent': ['error', 4],
        },
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
            stylistic,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            'no-unused-vars': 'off',
            'stylistic/indent': ['error', 4],
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
