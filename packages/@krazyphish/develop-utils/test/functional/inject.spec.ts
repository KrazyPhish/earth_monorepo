import { describe, expect, it } from "vitest"
import { inject } from "../../src"

describe("decorator name: inject", () => {
  interface Test {
    injectValue1: number
    injectValue2: string
  }

  @inject([
    {
      name: "injectValue1",
      value: 1,
      enumerable: true,
      configurable: true,
    },
    {
      name: "injectValue2",
      value: "2",
      enumerable: false,
      configurable: false,
    },
  ])
  class Test {}

  it("should inject those provided attrs to prototype of the class", () => {
    const descriptor1 = Object.getOwnPropertyDescriptor(Test.prototype, "injectValue1")!
    const descriptor2 = Object.getOwnPropertyDescriptor(Test.prototype, "injectValue2")!
    expect(Object.hasOwn(Test.prototype, "injectValue1")).toBe(true)
    expect(Object.hasOwn(Test.prototype, "injectValue2")).toBe(true)
    expect(descriptor1.configurable).toBe(true)
    expect(descriptor1.enumerable).toBe(true)
    expect(descriptor2.configurable).toBe(false)
    expect(descriptor2.enumerable).toBe(false)
  })
})
