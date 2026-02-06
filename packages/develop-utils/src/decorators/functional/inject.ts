/* eslint-disable @typescript-eslint/no-explicit-any */
type Attribute = {
  name: string | symbol
  value: any
  configurable?: boolean
  enumerable?: boolean
}

/**
 * @description 类属性注入装饰器
 */
export const inject = (attr: Attribute | Attribute[]): ClassDecorator => {
  const attrs = Array.isArray(attr) ? attr : [attr]
  const properties = attrs.reduce((prev, curr) => {
    const { name, value, configurable = false, enumerable = true } = curr
    prev[name] = {
      configurable,
      enumerable,
      value,
    }
    return prev
  }, {} as PropertyDescriptorMap)
  return (target) => {
    Object.defineProperties(target.prototype, properties)
    return target
  }
}
