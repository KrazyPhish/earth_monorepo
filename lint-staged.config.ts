const createLint = (target: string[]) => {
  const isCi = process.env.CI
  if (isCi) return []
  return target
}

export default {
  "*.{js,ts,jsx,tsx,vue}": createLint(["prettier --write", "eslint --ignore-pattern '*.config.ts'"]),
  "*.{js,ts,tsx,css,less,scss,vue,html,md}": createLint(["cspell lint"]),
}
