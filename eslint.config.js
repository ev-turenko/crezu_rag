import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json'
            }
        },
        plugins: {
            '@typescript-eslint': typescriptEslint
        },
        rules: {
            ...js.configs.recommended.rules,
            ...typescriptEslint.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn'
        }
    }
];