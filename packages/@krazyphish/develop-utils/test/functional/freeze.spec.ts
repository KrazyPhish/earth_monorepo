import { describe, expect, it } from "vitest"
import { freeze } from "../../src"

describe("decorator name: freeze", () => {
  @freeze
  class Test {
    static frozen: { a: number } = { a: 1 }
  }

  it("should freeze the static properties of a class", () => {
    expect(Object.isFrozen(Test)).toBe(true)
  })
})
