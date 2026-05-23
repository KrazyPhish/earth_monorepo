import viteRestart from "vite-plugin-restart"

export const restartPlugin = () => {
  return viteRestart({
    restart: ["*.config.[jt]s", "**/config/*.[jt]s"],
  })
}
