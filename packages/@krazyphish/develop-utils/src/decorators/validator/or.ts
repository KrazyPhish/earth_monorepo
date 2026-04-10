/* eslint-disable @typescript-eslint/no-explicit-any */
import { useValidatorMaker } from "./validate"
import { useTypeCheck } from "../useTypeCheck"

/**
 * @description 参数多类型验证装饰器
 * @param targets 要验证的类 / 类型
 * @param [attr] 属性名
 */
export const or = (targets: Array<new (...args: any[]) => any>, attr?: string | symbol): ParameterDecorator => {
  const check = (value: any) => {
    return targets.some((t) => useTypeCheck(t, value))
  }
  const reason = (index: number, key: string | symbol, attr?: string | symbol) => {
    const realKey = typeof key === "string" ? key : key.toString()
    const realAttr = attr ? `the '${typeof attr === "string" ? attr : attr.toString()}'` : "it"
    const tNames = targets.map((t) => t.name)
    return `Invalid parameter type of '${realKey}' at index ${index}, ${realAttr} should be '${tNames.join("', '")}'.`
  }
  return useValidatorMaker(check, reason, attr)
}
