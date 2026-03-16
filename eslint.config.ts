import eslint from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"
import { defineConfig } from "eslint/config"
import eslintConfigPrettier from "eslint-config-prettier/flat"
import eslintPluginPrettier from "eslint-plugin-prettier"

const ignores = ["**/node_modules/**", "**/dist/**", "/.*", "**/*.d.ts"]

export default defineConfig(
  {
    ignores,
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    plugins: { prettier: eslintPluginPrettier },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
    },
    rules: {
      eqeqeq: "error",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "new-cap": "error",
      "no-alert": "error",
      "no-await-in-loop": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-duplicate-imports": ["error", { includeExports: true }],
      "no-empty-function": "error",
      "no-else-return": "error",
      "no-implicit-globals": "error",
      "no-inline-comments": "error",
      "no-invalid-this": "error",
      "no-iterator": "error",
      "no-lone-blocks": "error",
      "no-lonely-if": "error",
      "no-nested-ternary": "error",
      "no-new-func": "error",
      "no-object-constructor": "error",
      "no-param-reassign": ["error", { props: false }],
      "no-proto": "error",
      "no-return-assign": "error",
      "no-script-url": "error",
      "no-sequences": "error",
      "no-undef-init": "error",
      "no-unneeded-ternary": "error",
      "no-unused-expressions": "error",
      "no-useless-call": "error",
      "no-useless-constructor": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "prefer-arrow-callback": ["error", { allowNamedFunctions: false, allowUnboundThis: false }],
      "prefer-const": "error",
      "require-await": "error",
    },
  },
  {
    ignores,
    files: ["apps/**/*.{ts,js,tsx,jsx,vue}", "packages/**/*.{ts,js,tsx,vue}"],
    extends: [...pluginVue.configs["flat/recommended"], eslintConfigPrettier],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    ignores,
    files: ["apps/server/**/*.{ts,js}"],
    extends: [eslintConfigPrettier],
    languageOptions: { globals: { ...globals.node } },
  }
)
