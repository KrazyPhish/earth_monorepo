import { describe, expect, it } from "vitest"
import { Color } from "../../src"
import { Color as CzmColor } from "cesium"

describe("unit test for semantic class: Color", () => {
  it("should throw an error when constructor passed in params are out of range", () => {
    expect(() => new Color()).not.toThrow()
    //300 is an invalid number
    expect(() => new Color(300, 0, 0)).toThrowError()
  })

  it("self colors are constant that cannot be reassigned", () => {
    expect(() => (Color.RED = new Color(255, 0, 0))).toThrowError()
    expect(() => (Color.RED.red = 255)).toThrowError()
  })

  it("method 'clone' returns the same color with different instance or reassign a provided instance", () => {
    const clone = Color.RED.clone()
    expect(clone).not.toBe(Color.RED)
    expect(clone.red).toBe(Color.RED.red)
    expect(clone.green).toBe(Color.RED.green)
    expect(clone.blue).toBe(Color.RED.blue)
    expect(clone.alpha).toBe(Color.RED.alpha)
    const clone2 = new Color()
    const clone3 = Color.RED.clone(clone2)
    expect(clone2).toBe(clone3)
    expect(clone3.red).toBe(Color.RED.red)
    expect(clone3.green).toBe(Color.RED.green)
    expect(clone3.blue).toBe(Color.RED.blue)
    expect(clone3.alpha).toBe(Color.RED.alpha)
  })

  it("method 'toHex' return the hex value of the color", () => {
    const hex = Color.RED.toHex()
    expect(hex).toBe(0xff0000ff)
  })

  it("method 'toCzmColor' return a cesium color instance", () => {
    const czmColor = Color.RED.toCzmColor()
    expect(czmColor).instanceOf(CzmColor)
  })

  it("method 'toCssColorString' returns a css value string of the color", () => {
    expect(Color.RED.toCssColorString()).toBe("rgb(255, 0, 0)")
    expect(new Color(255, 0, 0, 128).toCssColorString()).toBe("rgba(255, 0, 0, 0.5)")
  })

  it("method 'toHexColorString' returns a hex value string of the color", () => {
    expect(Color.RED.toHexColorString()).toBe("#ff0000")
    expect(new Color(255, 0, 0, 128).toHexColorString()).toBe("#ff000080")
  })

  it("method 'toString' returns a string by given template and the passed callback", () => {
    const temp = "[%r, %g, %b, %a]"
    const cb = (value: number, key: keyof Color) => {
      if (key === "red") return `r_${value}`
      if (key === "green") return `g_${value}`
      if (key === "blue") return `b_${value}`
      return `a_${value}`
    }
    const str = new Color(42, 43, 44, 45).toString(temp, cb)
    expect(str).toBe("[r_42, g_43, b_44, a_45]")
  })

  it("method 'withAlpha' returns the same color with alpha value that passed", () => {
    const color = Color.RED.withAlpha(0.5)
    expect(color).not.toBe(Color.RED)
    expect(color.red).toBe(Color.RED.red)
    expect(color.green).toBe(Color.RED.green)
    expect(color.blue).toBe(Color.RED.blue)
    expect(color.alpha).toBe(128)
  })

  it("method 'equals' compare two colors if the same in the diff value", () => {
    const color1 = new Color(1, 2, 3)
    const color2 = new Color(2, 3, 4)
    expect(Color.equals(color1, color2)).toBe(false)
    expect(Color.equals(color1, color2, 1)).toBe(true)
  })

  it("method 'fromHex' returns a color when pass through a valid hex value", () => {
    const color = Color.fromHex(0xff000080)
    expect(color.red).toBe(255)
    expect(color.green).toBe(0)
    expect(color.blue).toBe(0)
    expect(color.alpha).toBe(128)
  })

  it("method 'fromHsl' returns a color from hsl standard", () => {
    const color = Color.fromHsl(0, 0, 0, 1)
    expect(color.red).toBe(0)
    expect(color.green).toBe(0)
    expect(color.blue).toBe(0)
    expect(color.alpha).toBe(255)
  })

  it("method 'fromPercentage' returns a color from percentage values", () => {
    const color = Color.fromPercentage(1, 1, 1, 1)
    expect(color.red).toBe(255)
    expect(color.green).toBe(255)
    expect(color.blue).toBe(255)
    expect(color.alpha).toBe(255)
  })

  it("method 'fromCssColorString' return a color from css valid string value", () => {
    const undef = Color.fromCssColorString("invalid")
    expect(undef).toBe(undefined)
    const color1 = Color.fromCssColorString("pink")!
    expect(color1.red).toBe(255)
    expect(color1.green).toBe(192)
    expect(color1.blue).toBe(203)
    expect(color1.alpha).toBe(255)
    const color2 = Color.fromCssColorString("#ffc0cb")!
    expect(color2.red).toBe(255)
    expect(color2.green).toBe(192)
    expect(color2.blue).toBe(203)
    expect(color2.alpha).toBe(255)
    const color3 = Color.fromCssColorString("rgb(255, 192, 203)")!
    expect(color3.red).toBe(255)
    expect(color3.green).toBe(192)
    expect(color3.blue).toBe(203)
    expect(color3.alpha).toBe(255)
    const color4 = Color.fromCssColorString("hsl(350, 100%, 87.50%)")!
    expect(color4.red).toBe(255)
    expect(color4.green).toBe(191)
    expect(color4.blue).toBe(202)
    expect(color4.alpha).toBe(255)
  })

  it("method 'fromCzmColor' returns a color from CzmColor value", () => {
    const color = Color.fromCzmColor(CzmColor.RED)
    expect(color.red).toBe(Color.RED.red)
    expect(color.green).toBe(Color.RED.green)
    expect(color.blue).toBe(Color.RED.blue)
    expect(color.alpha).toBe(Color.RED.alpha)
  })

  it("method 'lerp' returns a lerp value from provided values", () => {
    const lerp = Color.lerp(Color.BLACK, Color.RED, 0.5)
    expect(lerp.red).toBe(127.5)
    expect(lerp.green).toBe(0)
    expect(lerp.blue).toBe(0)
    expect(lerp.alpha).toBe(255)
  })
})
