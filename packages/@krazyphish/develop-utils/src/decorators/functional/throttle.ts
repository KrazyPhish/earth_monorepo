/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description 函数节流装饰器
 * @param [limit = 300] 区间`ms`
 */
export const throttle = (limit: number = 300): MethodDecorator => {
  const map = new WeakMap<object, boolean>()
  return (_, __, descriptor) => {
    const origin = descriptor.value
    //@ts-expect-error descriptor may not function
    descriptor.value = function (...args: any[]) {
      if (!map.get(this)) {
        //@ts-expect-error redirect this
        origin.apply(this, args)
        map.set(this, true)
        setTimeout(() => {
          map.set(this, false)
        }, limit)
      }
    }
    return descriptor
  }
}
