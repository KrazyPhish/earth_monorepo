import type { PluginOption } from "vite"
import react from "@vitejs/plugin-react"
import cesium from "vite-plugin-cesium"
import { compressPlugin } from "./compress"
import { restartPlugin } from "./restart"
import { progressPlugin } from "./progress"
import { unocssPlugin } from "./unocss"
import { htmlConfig } from "./html"
import { tsconfigResolvePaths } from "./tsconfig"

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const { VITE_USE_COMPRESS } = viteEnv

  const vitePlugins: (PluginOption | PluginOption[])[] = [
    // react支持
    react(),

    //cesium
    cesium(),

    // 监听配置文件改动重启
    restartPlugin(),

    // 构建时显示进度条
    progressPlugin(),

    // unocss
    unocssPlugin(),

    //注入html
    htmlConfig(),

    //tsconfigPaths
    tsconfigResolvePaths(),
  ]

  if (isBuild) {
    // 开启.gz压缩  rollup-plugin-gzip
    if (VITE_USE_COMPRESS) vitePlugins.push(compressPlugin())
  }

  return vitePlugins
}
