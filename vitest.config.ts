import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          globals: true,
          name: "@krazyphish/develop-utils",
          include: ["packages/@krazyphish/develop-utils/test/**/*.{test,spec}.ts"],
          environment: "node",
        },
      },
      {
        test: {
          globals: true,
          name: "@krazyphish/earth",
          include: ["packages/@krazyphish/earth/test/**/*.{test,spec}.ts"],
          environment: "jsdom",
        },
        resolve: {
          preserveSymlinks: true,
          alias: {
            "@krazyphish/develop-utils": path.resolve(__dirname, "./packages/@krazyphish/develop-utils/src/index.ts"),
          },
        },
        ssr: {
          noExternal: ["@krazyphish/develop-utils"],
        },
      },
    ],
  },
})
