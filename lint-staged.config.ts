export default {
  "*.{js,ts,jsx,tsx,vue,md}": ["prettier --write", "eslint"],
  "*.{js,ts,mjs,cjs,json,tsx,css,less,scss,vue,html,md}": ["cspell lint"],
}
