import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...svelte.configs["flat/recommended"],
    prettier,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        files: ["**/*.svelte"],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
            },
        },
    },
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { "argsIgnorePattern": "^_" }
            ],
            "no-console": "warn",
            "svelte/no-navigation-without-resolve": [
                "error",
                {
                    ignoreGoto: true,
                    ignorePushState: false,
                    ignoreReplaceState: false,
                    ignoreLinks: true,
                }
            ]
        },
    },
    {
        ignores: [
            "node_modules/",
            "dist/",
            "build/",
            ".svelte-kit/",
            ".env.*",
            "docker-compose.yml",
            "Dockerfile*",
        ],
    }
);