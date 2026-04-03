import { describe, expect, it } from "vitest"
import { CoorFormat, Geographic } from "../../src"

describe("unit test for component class: Geographic", () => {
  it("receive the valid coordinate of geographic in degrees", () => {
    expect(() => new Geographic(120, 30)).not.toThrowError()
    expect(() => new Geographic(500, 120)).toThrowError()
  })

  it("self coordinates are constant that cannot be reassigned", () => {
    expect(() => (Geographic.NORTH_POLE = new Geographic(0, 90))).toThrowError()
    expect(() => (Geographic.NORTH_POLE.latitude = 90)).toThrowError()
  })

  it("method 'toCartesian' returns a cartesian coordinate of the geographic one", () => {
    const geo = new Geographic(0, 0, -6378137)
    const cartesian = geo.toCartesian()
    expect(cartesian.x).toBe(0)
    expect(cartesian.y).toBe(0)
    expect(cartesian.z).toBe(0)
  })

  it("method 'toCartographic' returns a cartographic coordinate of the geographic one", () => {
    const geo = new Geographic(0, 0, -6378137)
    const carto = geo.toCartographic()
    expect(carto.longitude).toBe(0)
    expect(carto.latitude).toBe(0)
    expect(carto.height).toBe(-6378137)
  })

  it("method 'toArray' returns an array of the geographic longitude and latitude", () => {
    const geo = new Geographic(120, 30, 5000)
    const array = geo.toArray()
    expect(array).toStrictEqual([120, 30])
  })

  it("method 'toArrayHeight' returns an array of the geographic all dimensions", () => {
    const geo = new Geographic(120, 30, 5000)
    const array = geo.toArrayHeight()
    expect(array).toStrictEqual([120, 30, 5000])
  })

  it("method 'clone' returns the same geographic with different instance or reassign a provided instance", () => {
    const clone = Geographic.NORTH_POLE.clone()
    expect(clone).not.toBe(Geographic.NORTH_POLE)
    expect(clone.longitude).toBe(Geographic.NORTH_POLE.longitude)
    expect(clone.latitude).toBe(Geographic.NORTH_POLE.latitude)
    expect(clone.height).toBe(Geographic.NORTH_POLE.height)
    const clone2 = new Geographic()
    const clone3 = Geographic.NORTH_POLE.clone(clone2)
    expect(clone2).toBe(clone3)
    expect(clone3.longitude).toBe(Geographic.NORTH_POLE.longitude)
    expect(clone3.latitude).toBe(Geographic.NORTH_POLE.latitude)
    expect(clone3.height).toBe(Geographic.NORTH_POLE.height)
  })

  it("method 'format' returns the format information of the geographic coordinates", () => {
    const geo = new Geographic(23.55, 23.55)
    const format1 = geo.format()
    const format2 = geo.format(CoorFormat.DMSS)
    expect(format1.latitude).toBe("23°33′0″N")
    expect(format2.latitude).toBe("233300N")
    expect(format1.longitude).toBe("23°33′0″E")
    expect(format2.longitude).toBe("233300E")
  })

  it("method 'toString' returns a string by given template and the passed callback", () => {
    const temp = "[%x, %y, %z]"
    const cb = (value: number, key: keyof Geographic) => {
      if (key === "longitude") return `lon_${value}`
      if (key === "latitude") return `lat_${value}`
      if (key === "height") return `alt_${value}`
      return `a_${value}`
    }
    const str = new Geographic(42, 43, 44).toString(temp, cb)
    expect(str).toBe("[lon_42, lat_43, alt_44]")
  })

  it("method 'equals' compare two geographic coordinates if the same in the diff value", () => {
    const geo1 = new Geographic(1, 2, 3)
    const geo2 = new Geographic(2, 3, 4)
    expect(Geographic.equals(geo1, geo2)).toBe(false)
    expect(Geographic.equals(geo1, geo2, 1)).toBe(true)
  })
})
