/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description 访问器缓存值装饰器，计算一次以节省性能
 */
export const memorize: MethodDecorator = (_, __, descriptor) => {
  let cachedValue: any
  const originGet = descriptor.get
  descriptor.get = function () {
    if (cachedValue) return cachedValue
    cachedValue = originGet?.apply(this)
    return cachedValue
  }
  return descriptor
}
