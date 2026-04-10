import { describe, expect, it } from "vitest"
import { generate } from "../../src"

describe("decorator name: generate", () => {
  interface Test {
    _value1: number
    _value2: string
  }

  class Test {
    @generate(1) value1!: number
    @generate("2") value2!: string
  }

  it("should generate a property with private and public", () => {
    expect(Object.hasOwn(Test.prototype, "value1")).toBe(true)
    expect(Object.hasOwn(Test.prototype, "value2")).toBe(true)
    expect(Object.hasOwn(Test.prototype, "_value1")).toBe(true)
    expect(Object.hasOwn(Test.prototype, "_value2")).toBe(true)

    const test = new Test()
    expect(test.value1).toBe(1)
    expect(test._value1).toBe(1)
    expect(test.value2).toBe("2")
    expect(test._value2).toBe("2")
  })

  it("should make the origin property to be read-only", () => {
    const test = new Test()
    expect(() => {
      test.value1 = 2
    }).toThrow()
  })
})
