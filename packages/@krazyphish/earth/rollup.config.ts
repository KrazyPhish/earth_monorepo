import * as packageJson from "./package.json"
import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import terser from "@rollup/plugin-terser"
import json from "@rollup/plugin-json"
import autoprefixer from "autoprefixer"
import cssnano from "cssnano"
import postcss from "rollup-plugin-postcss"
import { defineConfig } from "rollup"
import { writeFileSync } from "fs"
import { defineRollupConfig } from "build-utils"

const configInfo = `//auto generated, no need to change
export const pkg = {
  name: "${packageJson.name}",
  author: "${packageJson.author}",
  version: "${packageJson.version}",
} as const
`
writeFileSync("./src/config.ts", configInfo)

const config = defineRollupConfig({
  input: "src/index.ts",
  external: ["cesium", "echarts"],
  mainName: packageJson.main,
  moduleName: packageJson.module,
  plugins: [
    commonjs(),
    typescript(),
    nodeResolve(),
    terser({ keep_classnames: true, keep_fnames: true }),
    json(),
    postcss({
      extract: "style.css",
      plugins: [autoprefixer(), cssnano()],
    }),
  ],
})

export default defineConfig(config)
