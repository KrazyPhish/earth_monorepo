/* eslint-disable @typescript-eslint/no-explicit-any */
import { useValidatorMaker } from "./validate"

/**
 * @description 数组长度验证装饰器
 * @param multiple 要验证的长度倍数
 * @param [attr] 属性名
 */
export const multipleOf = (multiple: number, attr?: string | symbol): ParameterDecorator => {
  const check = (value: any[]) => {
    return !(value.length % multiple)
  }
  const reason = (index: number, key: string | symbol, attr?: string | symbol) => {
    const realKey = typeof key === "string" ? key : key.toString()
    const realAttr = attr ? `the '${typeof attr === "string" ? attr : attr.toString()}'′s` : "its"
    return `Invalid array length of '${realKey}' at index ${index}, ${realAttr} length must be multiple of ${multiple}.`
  }
  return useValidatorMaker(check, reason, attr)
}
