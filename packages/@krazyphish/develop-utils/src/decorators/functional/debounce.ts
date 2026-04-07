/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description 函数防抖装饰器
 * @param [delay = 300] 延迟`ms`
 */
export const debounce = (delay: number = 300): MethodDecorator => {
  return (_, __, descriptor) => {
    const cacheMap = new WeakMap<object, NodeJS.Timeout>()
    const origin = descriptor.value
    //@ts-expect-error descriptor may not function
    descriptor.value = function (...args: any[]) {
      if (cacheMap.has(this)) {
        clearTimeout(cacheMap.get(this))
      }
      const timer = setTimeout(() => {
        //@ts-expect-error redirect this
        origin.apply(this, args)
      }, delay)
      cacheMap.set(this, timer)
    }
    return descriptor
  }
}
