import { describe, expect, it } from "vitest"
import { constant } from "../../src"

describe("decorator name: constant", () => {
  const value: { a: number } = { a: 1 }

  class Test {
    @constant(value) static val: { a: number }
  }

  it("should define a constant property", () => {
    const descriptor = Object.getOwnPropertyDescriptor(Test, "val")!
    expect(Test.val).toBe(value)
    expect(Object.isFrozen(Test.val)).toBe(true)
    expect(descriptor.writable).toBe(false)
    expect(descriptor.configurable).toBe(false)
    expect(descriptor.enumerable).toBe(true)
  })

  it("should not allow reassignment", () => {
    expect(() => {
      Test.val = { a: 2 }
    }).toThrow()
  })
})
