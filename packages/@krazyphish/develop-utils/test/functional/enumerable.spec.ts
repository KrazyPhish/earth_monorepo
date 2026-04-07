import { describe, expect, it } from "vitest"
import { enumerable } from "../../src"

describe("decorator name: enumerable", () => {
  it("should define a prop's enumerable status", () => {
    class Test {
      @enumerable(false) static prop1: number = 1
      @enumerable(true) static prop2: number = 2
    }
    const propDescriptor1 = Object.getOwnPropertyDescriptor(Test, "prop1")!
    const propDescriptor2 = Object.getOwnPropertyDescriptor(Test, "prop2")!
    expect(propDescriptor1.enumerable).toBe(false)
    expect(propDescriptor2.enumerable).toBe(true)
  })
})
