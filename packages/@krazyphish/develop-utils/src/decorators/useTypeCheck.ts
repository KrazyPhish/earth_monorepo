/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description 类型检查
 * @param target 目标类型
 * @param value 要检查的值
 */
export const useTypeCheck = (target: new (...args: any[]) => any, value: any) => {
  if (target === Number) {
    return typeof value === "number" && !Number.isNaN(value)
  } else if (target === String) {
    return typeof value === "string"
  } else if (target === Boolean) {
    return typeof value === "boolean"
  } else if (target === Object) {
    return typeof value === "object" && value !== null
  } else if (target === Function) {
    const isClass = !!target.prototype
    return typeof value === "function" && isClass
  }
  return value instanceof target
}
