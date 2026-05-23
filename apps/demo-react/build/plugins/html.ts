import { createHtmlPlugin } from "vite-plugin-html"

export const htmlConfig = () => {
  return createHtmlPlugin({
    minify: true,
    entry: "src/main.tsx",
  })
}
