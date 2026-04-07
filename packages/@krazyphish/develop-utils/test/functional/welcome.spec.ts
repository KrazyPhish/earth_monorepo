/* eslint-disable no-empty-function */
import { describe, expect, it, vi } from "vitest"
import { welcome } from "../../src"

describe("decorator name: welcome", () => {
  const pkg = { name: "test", version: "v1.0.1", author: "KrazyPhish" }
  const picPath = "testPicturePath"
  const groupStartWatcher = vi.spyOn(console, "groupCollapsed").mockImplementation(() => {})
  const groupEndWatcher = vi.spyOn(console, "groupEnd").mockImplementation(() => {})
  const consoleWatcher = vi.spyOn(console, "log").mockImplementation(() => {})

  interface Test {
    author: string
    version: string
  }

  @welcome(pkg, picPath)
  class Test {}

  it("should log the welcome info when class initialize", () => {
    expect(groupStartWatcher).toBeCalledTimes(1)
    expect(groupEndWatcher).toBeCalledTimes(1)
    expect(consoleWatcher).toBeCalledTimes(1)
  })

  it("should append the 'author' and 'version' properties to the prototype of the class", () => {
    expect(Object.hasOwn(Test.prototype, "author")).toBe(true)
    expect(Object.hasOwn(Test.prototype, "version")).toBe(true)
  })

  it("should have the correct info of 'pkg' argument passed in", () => {
    const test = new Test()
    expect(test.author).toBe("KrazyPhish")
    expect(test.version).toBe("v1.0.1")
  })
})
