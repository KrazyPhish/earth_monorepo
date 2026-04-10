import * as packageJson from "./package.json"
import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import terser from "@rollup/plugin-terser"
import { defineConfig } from "rollup"
import { defineRollupConfig } from "build-utils"

const config = defineRollupConfig({
  input: "src/index.ts",
  mainName: packageJson.main,
  moduleName: packageJson.module,
  plugins: [commonjs(), typescript(), nodeResolve(), terser({ keep_classnames: true, keep_fnames: true })],
})

export default defineConfig(config)
