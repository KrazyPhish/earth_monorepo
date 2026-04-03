import { describe, expect, it } from "vitest"
import { CameraTool } from "../../src"

describe("unit test for util class: CameraTool", () => {
  it("properties or methods on CameraTool cannot be reassigned", () => {
    expect(() => {
      CameraTool.getLevelByHeight = (lvl: number) => lvl
    }).toThrowError()
  })

  it("method 'getLevelMaxHeight' returns the max height of given level", () => {
    const height1 = CameraTool.getLevelMaxHeight(1)
    const height2 = CameraTool.getLevelMaxHeight(25)
    expect(height1).toBe(10123000)
    expect(height2).toBe(1000)
  })

  it("method 'getLevelByHeight' returns the level that given height belongs to", () => {
    const lvl1 = CameraTool.getLevelByHeight(1200)
    const lvl2 = CameraTool.getLevelByHeight(20000000)
    expect(lvl1).toBe(19)
    expect(lvl2).toBe(2)
  })
})
