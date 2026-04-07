import { useValidatorMaker } from "./validate"

/**
 * @description 参数小于范围验证装饰器
 * @param anchor 要验证的锚点值
 * @param [include = true] 是否包含边界
 * @param [attr] 属性名
 */
export const lessThan = (anchor: number, include: boolean = true, attr?: string | symbol): ParameterDecorator => {
  const check = (value: number) => {
    return (include && value <= anchor) || (!include && value < anchor)
  }
  const reason = (index: number, key: string | symbol, attr?: string | symbol) => {
    const realKey = typeof key === "string" ? key : key.toString()
    const realAttr = attr ? `the '${typeof attr === "string" ? attr : attr.toString()}'` : "it"
    const description = include ? "equal or less" : "less"
    return `Invalid parameter of '${realKey}' at index ${index}, ${realAttr} should be ${description} than ${anchor}.`
  }
  return useValidatorMaker(check, reason, attr)
}
