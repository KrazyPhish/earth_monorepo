/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description 属性生成器
 * @param [value] 默认值
 * 1. 不要使用引用值作为生成器的默认值
 * 2. 尤其是生成器用于基类（被其他类继承的类）属性生成的时候
 * 3. 除非使用到的类是一个严格的单例类
 * 4. 不要使用可能被当作唯一值的值作为生成器的默认值，如id，uuid
 */
export const generate = (value?: any): PropertyDecorator => {
  return (target, prop) => {
    const key = typeof prop === "string" ? prop : prop.toString()
    const pName = `_${key}`
    Object.defineProperty(target, pName, {
      configurable: false,
      enumerable: false,
      writable: true,
      value,
    })
    Object.defineProperty(target, prop, {
      configurable: false,
      enumerable: true,
      get() {
        if (typeof prop === "string") return this[`_${prop}`]
        return this[pName]
      },
      set() {
        throw Error(`Cannot assign to '${key}', because it is a read-only property.`)
      },
    })
  }
}
