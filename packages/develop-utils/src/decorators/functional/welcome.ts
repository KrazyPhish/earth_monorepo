/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/**
 * @description 欢迎信息装饰器
 * @param pkg pkg信息
 * @param picPath 图标路径
 */
export const welcome = (pkg: any, picPath: string): ClassDecorator => {
  return (target) => {
    console.groupCollapsed(
      "%c %c " + "Welcome to use.",
      `
    padding: 5px 5px;
    background: url(${picPath}) no-repeat;
    background-size: contain;
    width: 20px;
    height: 20px;
  `,
      `
    font-size: 14px;
    padding-left: 5px;
    align-items: center;
  `
    )
    const tooltip = `
    Package: ${pkg.name}
    Author: ${pkg.author}
    Version: ${pkg.version}
    Time: ${new Date().toLocaleString()}
  `
    console.log(tooltip)
    console.groupEnd()
    const map: string[][] = [
      ["author", pkg.author],
      ["version", pkg.version],
    ]
    const properties = map.reduce((prev, curr) => {
      const [key, value] = curr
      prev[key] = { configurable: false, get: () => value }
      return prev
    }, {} as PropertyDescriptorMap)
    Object.defineProperties(target.prototype, properties)
    return target
  }
}
