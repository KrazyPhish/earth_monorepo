import { describe, expect, it } from "vitest"
import { Hpr } from "../../src"
import { HeadingPitchRoll } from "cesium"

describe("unit test for semantic class: Hpr", () => {
  it("describe a hpr property by degree values", () => {
    const hpr = new Hpr(120, 240, 360)
    expect(hpr.heading).toBe(120)
    expect(hpr.pitch).toBe(240)
    expect(hpr.roll).toBe(0)
  })

  it("method 'clone' returns the same hpr with different instance or reassign a provided instance", () => {
    const hpr = new HeadingPitchRoll(1, 1, 1)
    const clone = hpr.clone()
    expect(clone).not.toBe(hpr)
    expect(clone.heading).toBe(hpr.heading)
    expect(clone.pitch).toBe(hpr.pitch)
    expect(clone.roll).toBe(hpr.roll)
    const clone2 = new HeadingPitchRoll()
    const clone3 = hpr.clone(clone2)
    expect(clone2).toBe(clone3)
    expect(clone3.heading).toBe(hpr.heading)
    expect(clone3.pitch).toBe(hpr.pitch)
    expect(clone3.roll).toBe(hpr.roll)
  })

  it("method 'toHeadingPitchRoll' returns a 'HeadingPitchRoll' value", () => {
    const hpr = new Hpr()
    const headingPitchRoll = hpr.toHeadingPitchRoll()
    expect(headingPitchRoll).instanceOf(HeadingPitchRoll)
  })

  it("method 'equals' compare two hpr if the same in the diff value", () => {
    const hpr1 = new Hpr()
    const hpr2 = new Hpr(1, 1, 1)
    expect(Hpr.equals(hpr1, hpr2)).toBe(false)
    expect(Hpr.equals(hpr1, hpr2, 1)).toBe(true)
  })

  it("method 'fromHeadingPitchRoll' returns a hpr from provided 'HeadingPitchRoll value'", () => {
    const hpr = Hpr.fromHeadingPitchRoll(new HeadingPitchRoll())
    expect(hpr).instanceOf(Hpr)
  })
})
