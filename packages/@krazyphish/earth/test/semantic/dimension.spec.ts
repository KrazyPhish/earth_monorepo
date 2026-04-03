import { describe, expect, it } from "vitest"
import { Dimension } from "../../src"
import { Cartesian2, Cartesian3, Cartesian4 } from "cesium"

describe("unit test for semantic class: Dimension", () => {
  it("self values are constant that cannot be reassigned", () => {
    expect(() => (Dimension.ZERO = new Dimension())).toThrowError()
    expect(() => (Dimension.ONE.x = 2)).toThrowError()
  })

  it("method 'clone' returns the same dimension with different instance or reassign a provided instance", () => {
    const clone = Dimension.ONE.clone()
    expect(clone).not.toBe(Dimension.ONE)
    expect(clone.x).toBe(Dimension.ONE.x)
    expect(clone.y).toBe(Dimension.ONE.y)
    expect(clone.z).toBe(Dimension.ONE.z)
    expect(clone.w).toBe(Dimension.ONE.w)
    const clone2 = new Dimension()
    const clone3 = Dimension.ONE.clone(clone2)
    expect(clone2).toBe(clone3)
    expect(clone3.x).toBe(Dimension.ONE.x)
    expect(clone3.y).toBe(Dimension.ONE.y)
    expect(clone3.z).toBe(Dimension.ONE.z)
    expect(clone3.w).toBe(Dimension.ONE.w)
  })

  it("method 'toArray' returns an array of the dimension", () => {
    const array2 = Dimension.ONE.toArray(2)
    expect(array2).toStrictEqual([1, 1])
    const array3 = Dimension.ONE.toArray(3)
    expect(array3).toStrictEqual([1, 1, 1])
    const array4 = Dimension.ONE.toArray(4)
    expect(array4).toStrictEqual([1, 1, 1, 1])
  })

  it("method 'toCartesian2' returns a 'Cartesian2' value with its 'x' and 'y'", () => {
    const dimension = new Dimension(1, 2, 3, 4)
    const cartesian = dimension.toCartesian2()
    expect(cartesian.x).toBe(1)
    expect(cartesian.y).toBe(2)
  })

  it("method 'toCartesian3' returns a 'Cartesian3' value with its 'x', 'y' and 'z'", () => {
    const dimension = new Dimension(1, 2, 3, 4)
    const cartesian = dimension.toCartesian3()
    expect(cartesian.x).toBe(1)
    expect(cartesian.y).toBe(2)
    expect(cartesian.z).toBe(3)
  })

  it("method 'toCartesian4' returns a 'Cartesian4' value", () => {
    const dimension = new Dimension(1, 2, 3, 4)
    const cartesian = dimension.toCartesian4()
    expect(cartesian.x).toBe(1)
    expect(cartesian.y).toBe(2)
    expect(cartesian.z).toBe(3)
    expect(cartesian.w).toBe(4)
  })

  it("method 'toString' returns a string by provided template", () => {
    const str = Dimension.ONE.toString("[%x, %y, %z, %w]")
    expect(str).toBe("[1, 1, 1, 1]")
  })

  it("method 'equals' compare two dimensions if the same in the diff value", () => {
    expect(Dimension.equals(Dimension.ONE, Dimension.ZERO)).toBe(false)
    expect(Dimension.equals(Dimension.ONE, Dimension.ZERO, 1)).toBe(true)
  })

  it("method 'fromArray' returns a dimension from provided array", () => {
    const dimension = Dimension.fromArray([2, 3, 4, 5])
    expect(dimension.x).toBe(2)
    expect(dimension.y).toBe(3)
    expect(dimension.z).toBe(4)
    expect(dimension.w).toBe(5)
  })

  it("method 'fromCartesian2' returns a dimension from provided 'Cartesian2' value", () => {
    const dimension = Dimension.fromCartesian2(Cartesian2.ONE)
    expect(dimension).instanceOf(Dimension)
    expect(dimension.x).toBe(Cartesian2.ONE.x)
    expect(dimension.y).toBe(Cartesian2.ONE.y)
    expect(dimension.z).toBe(0)
    expect(dimension.w).toBe(0)
  })

  it("method 'fromCartesian3' returns a dimension from provided 'Cartesian3' value", () => {
    const dimension = Dimension.fromCartesian3(Cartesian3.ONE)
    expect(dimension).instanceOf(Dimension)
    expect(dimension.x).toBe(Cartesian3.ONE.x)
    expect(dimension.y).toBe(Cartesian3.ONE.y)
    expect(dimension.z).toBe(Cartesian3.ONE.z)
    expect(dimension.w).toBe(0)
  })

  it("method 'fromCartesian4' returns a dimension from provided 'Cartesian4' value", () => {
    const dimension = Dimension.fromCartesian4(Cartesian4.ONE)
    expect(dimension).instanceOf(Dimension)
    expect(dimension.x).toBe(Cartesian4.ONE.x)
    expect(dimension.y).toBe(Cartesian4.ONE.y)
    expect(dimension.z).toBe(Cartesian4.ONE.z)
    expect(dimension.w).toBe(Cartesian4.ONE.w)
  })
})
