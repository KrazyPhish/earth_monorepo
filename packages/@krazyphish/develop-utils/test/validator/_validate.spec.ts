import { describe, expect, it, vi } from "vitest"
import { validate, useValidatorMaker } from "../../src"

describe("decorator name: validate", () => {
  const reason = (index: number, key: string | symbol, attr?: string | symbol) => {
    const k = typeof key === "string" ? key : key.toString()
    const a = typeof attr === "string" ? attr : String(attr)
    return `${index}_${k}_${a}`
  }
  const failed = () => false
  const succeed = () => true
  const testerRule = (value: string | number) => typeof value === "number"
  const failedParamTester = useValidatorMaker(failed, reason)
  const succeedParamTester = useValidatorMaker(succeed, reason)
  const paramTester = useValidatorMaker(testerRule, reason)

  it("should proxy the constructors, when they have params to validate", () => {
    const watcher = vi.fn()
    @validate
    class Test {
      constructor() {
        watcher()
      }
    }
    new Test()
    expect(watcher).toBeCalledTimes(1)
  })

  it("should throw errors when the validation not passed", () => {
    const cannotReached = vi.fn((value: number) => value)
    @validate
    class Test {
      constructor(@failedParamTester value: number) {
        cannotReached(value)
      }
    }
    expect(() => new Test(42)).toThrowError("0_constructor_")
    expect(cannotReached).toBeCalledTimes(0)
  })

  it("should call origin method when the validation passed", () => {
    const shouldReached = vi.fn((value: number) => value)
    class Test {
      @validate
      method(@succeedParamTester value: number) {
        return shouldReached(value)
      }
    }
    const test = new Test()
    expect(test.method(42)).toBe(42)
    expect(shouldReached).toBeCalledTimes(1)
  })

  it("should validate params by parameter decorators", () => {
    const couldReached = vi.fn((value: number | string) => value)
    class Test {
      @validate
      method(@paramTester value: number | string) {
        return couldReached(value)
      }
    }
    const test = new Test()
    expect(() => test.method(42)).not.toThrow()
    expect(couldReached).toBeCalledTimes(1)
    expect(() => test.method("42")).toThrowError("0_method_")
    expect(couldReached).toBeCalledTimes(1)
  })

  it("should ignore the partial params when they never pass any values", () => {
    const couldReached = vi.fn((value: number | string) => value)
    class Test {
      @validate
      method(param: string, @paramTester value: number | string = 2) {
        return couldReached(param + value)
      }
    }
    const test = new Test()
    expect(() => test.method("4")).not.toThrow()
    expect(couldReached).toBeCalledTimes(1)
    expect(() => test.method("4", "2")).toThrowError("1_method_")
    expect(couldReached).toBeCalledTimes(1)
  })
})
