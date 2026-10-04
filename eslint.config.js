{
	"root": true,
	"extends": ["eslint:recommended", "plugin:svelte/recommended", "prettier"],
	"parserOptions": {
		"ecmaVersion": 2022,
		"sourceType": "module"
	},
	"env": {
		"browser": true,
		"es2022": true,
		"node": true
	},
	"overrides": [
		{
			"files": ["*.svelte"],
			"parser": "svelte-eslint-parser",
			"parserOptions": {
				"parser": {
					"ts": "@typescript-eslint/parser",
					"typescript": "@typescript-eslint/parser"
				}
			}
		}
	],
	"rules": {
		"no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
	}
}
