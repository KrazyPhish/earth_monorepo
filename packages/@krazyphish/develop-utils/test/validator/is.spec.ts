import { describe, expect, it } from "vitest"
import { is, validate } from "../../src"

describe("decorator name: is", () => {
  class Answer {
    value: number = 42
  }
  class Question {
    value: number = 43
  }

  @validate
  class Universe {
    answer: number | string
    constructor(@is(Number) answer: number | string) {
      this.answer = answer
    }
    @validate
    findAnswer(@is(Answer) answer: Answer | Question) {
      return answer.value
    }
    @validate
    findAnswerOf(@is(Answer, "answer") param: { answer: Answer | Question }) {
      return param.answer.value
    }
  }

  it("should check if the type of param is what the decorator claimed", () => {
    expect(() => new Universe(42)).not.toThrow()
    expect(() => new Universe("42")).toThrowError(
      "Invalid parameter type of 'constructor' at index 0, it should be 'Number'."
    )
    const universe = new Universe(42)
    expect(() => universe.findAnswer(new Answer())).not.toThrow()
    expect(() => universe.findAnswer(new Question())).toThrowError(
      "Invalid parameter type of 'findAnswer' at index 0, it should be 'Answer'."
    )
  })

  it("should check if the type of param's attr is what the decorator claimed", () => {
    const universe = new Universe(42)
    expect(() => universe.findAnswerOf({ answer: new Answer() })).not.toThrow()
    expect(() => universe.findAnswerOf({ answer: new Question() })).toThrowError(
      "Invalid parameter type of 'findAnswerOf' at index 0, the 'answer' should be 'Answer'."
    )
  })
})
