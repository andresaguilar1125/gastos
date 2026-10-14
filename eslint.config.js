import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import ts from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ ignores: ['build/**', '.svelte-kit/**', 'node_modules/**'] },

	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,

	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// The app uses plain local Maps for one-off computations (not reactive
			// state), and computes some derived values with $state + $effect.
			'svelte/prefer-svelte-reactivity': 'off',
			'svelte/prefer-writable-derived': 'off',
			// Internal links are built from `base` (see TopNav/BottomNav), which is
			// base-path safe; `resolve()`'s typings are broken with this TS version.
			'svelte/no-navigation-without-resolve': 'off'
		}
	},

	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: ts,
			parserOptions: { sourceType: 'module' }
		}
	},

	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: { parser: ts }
		}
	}
];
