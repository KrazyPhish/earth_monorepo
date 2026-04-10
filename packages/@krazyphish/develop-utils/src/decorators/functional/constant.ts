/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description 静态属性不可变装饰器
 */
export const constant = (value: any): PropertyDecorator => {
  return (target, prop) => {
    Object.defineProperty(target, prop, {
      enumerable: true,
      configurable: false,
      writable: false,
      value: Object.freeze(value),
    })
  }
}
