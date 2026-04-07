import { describe, expect, it } from "vitest"
import { or, validate } from "../../src"

describe("decorator name: or", () => {
  class Answer {
    value: number = 42
  }
  class Question {
    value: number = 43
  }
  class Problem {
    value: number = 44
  }

  @validate
  class Universe {
    answer: number | string | boolean
    constructor(@or([Number, String]) answer: number | string | boolean) {
      this.answer = answer
    }
    @validate
    findAnswer(@or([Answer, Question]) answer: Answer | Question | Problem) {
      return answer.value
    }
    @validate
    findAnswerOf(@or([Problem, Question], "todo") param: { todo: Answer | Question | Problem }) {
      return param.todo.value
    }
  }

  it("should check if the type of param is what the decorator claimed", () => {
    expect(() => new Universe(42)).not.toThrow()
    expect(() => new Universe("42")).not.toThrow()
    expect(() => new Universe(true)).toThrowError(
      "Invalid parameter type of 'constructor' at index 0, it should be 'Number', 'String'."
    )
    const universe = new Universe(42)
    expect(() => universe.findAnswer(new Answer())).not.toThrow()
    expect(() => universe.findAnswer(new Question())).not.toThrow()
    expect(() => universe.findAnswer(new Problem())).toThrowError(
      "Invalid parameter type of 'findAnswer' at index 0, it should be 'Answer', 'Question'."
    )
  })

  it("should check if the type of param's attr is what the decorator claimed", () => {
    const universe = new Universe(42)
    expect(() => universe.findAnswerOf({ todo: new Problem() })).not.toThrow()
    expect(() => universe.findAnswerOf({ todo: new Question() })).not.toThrow()
    expect(() => universe.findAnswerOf({ todo: new Answer() })).toThrowError(
      "Invalid parameter type of 'findAnswerOf' at index 0, the 'todo' should be 'Problem', 'Question'."
    )
  })
})
