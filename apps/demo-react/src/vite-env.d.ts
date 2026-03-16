/// <reference types="vite/client" />

declare type ViteEnv = {
  VITE_BASE_URL: string
  VITE_PUBLIC_PATH: string
  VITE_USE_PROXY?: boolean
  VITE_USE_COMPRESS: boolean
}
