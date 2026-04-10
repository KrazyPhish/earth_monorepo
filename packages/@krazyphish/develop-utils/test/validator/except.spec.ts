import { describe, expect, it } from "vitest"
import { except, validate } from "../../src"

describe("decorator name: except", () => {
  @validate
  class Test {
    universe: string
    constructor(@except("41") value: string) {
      this.universe = value
    }
    @validate
    findUniverseAnswer(@except("41", true) value: string) {
      return value
    }
    @validate
    findAnswer(@except(["41", "43"]) value: string) {
      return value
    }
    @validate
    findAnswerOf(@except("41", false, "universe") value: { universe: string }) {
      return value.universe
    }
  }

  it("should not pass when the param includes the certain characters", () => {
    expect(() => new Test("41")).toThrowError(
      "Invalid parameter string of 'constructor' at index 0, it cannot be '41'."
    )
  })

  it("should pass when 'includeAccepted' is true and param not exactly equal to the except", () => {
    const test = new Test("42")
    expect(() => test.findUniverseAnswer("_41_")).not.toThrow()
  })

  it("could choose the certain attr when the param pass an object", () => {
    const test = new Test("42")
    expect(() => test.findAnswerOf({ universe: "42" })).not.toThrow()
    expect(() => test.findAnswerOf({ universe: "41" })).toThrowError(
      "Invalid parameter string of 'findAnswerOf' at index 0, the 'universe' cannot be '41'."
    )
  })

  it("could pass a list of excepts when validating params", () => {
    const test = new Test("42")
    expect(() => test.findAnswer("42")).not.toThrow()
    expect(() => test.findAnswer("41")).toThrowError(
      "Invalid parameter string of 'findAnswer' at index 0, it cannot be '41', '43'."
    )
  })
})
