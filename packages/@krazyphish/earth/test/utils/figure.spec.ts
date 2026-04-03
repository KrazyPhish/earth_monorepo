import { describe, expect, it } from "vitest"
import { Figure, Geographic } from "../../src"
import { Rectangle } from "cesium"

describe("unit test for util class: Figure", () => {
  it("properties or methods on Figure cannot be reassigned", () => {
    expect(() => {
      Figure.crossProduct = (a: number[], b: number[], c: number[]) => a.length + b.length + c.length
    }).toThrowError()
  })

  it("method 'crossProduct' returns the result of cross product for two vectors", () => {
    const a = [0, 0]
    const b = [0, 1]
    const c = [1, 0]
    const d = [0, -1]
    const res1 = Figure.crossProduct(a, b, c)
    expect(res1).greaterThan(0)
    const res2 = Figure.crossProduct(a, b, d)
    expect(res2).toBe(0)
  })

  it("method 'pointInRectangle' returns if the point is in rectangle", () => {
    const pointIn = new Geographic(50, 30)
    const pointOut = new Geographic(0, -10)
    const rect = Rectangle.fromDegrees(40, 20, 60, 40)
    const inner = Figure.pointInRectangle(pointIn, rect)
    const outer = Figure.pointInRectangle(pointOut, rect)
    expect(inner).toBe(true)
    expect(outer).toBe(false)
  })

  it("method 'pointInCircle' returns if the point is in circle", () => {
    const pointIn = new Geographic(0, 0.001)
    const pointOut = new Geographic(0, 70)
    const center = new Geographic(0, 0)
    const inner = Figure.pointInCircle(pointIn, center, 10000)
    const outer = Figure.pointInCircle(pointOut, center, 10000)
    expect(inner).toBe(true)
    expect(outer).toBe(false)
  })

  it("method 'pointInPolygon' returns if the point is in polygon", () => {
    const pointIn = new Geographic(50, 30)
    const pointOut = new Geographic(0, -10)
    const polygon = Geographic.fromDegreesArray([40, 40, 60, 40, 60, 20, 40, 20, 40, 40])
    const inner = Figure.pointInPolygon(pointIn, polygon)
    const outer = Figure.pointInPolygon(pointOut, polygon)
    expect(inner).toBe(true)
    expect(outer).toBe(false)
  })

  it("method 'polylineIntersectPolyline' returns if two polylines are intersecting", () => {
    const line1 = Geographic.fromDegreesArray([0, 0, 1, 1])
    const line2 = Geographic.fromDegreesArray([1, 0, 0, 1])
    const line3 = Geographic.fromDegreesArray([0, -1, 1, 0])
    const intersect12 = Figure.polylineIntersectPolyline(line1, line2)
    const intersect13 = Figure.polylineIntersectPolyline(line1, line3)
    expect(intersect12).toBe(true)
    expect(intersect13).toBe(false)
  })

  it("method 'polylineIntersectRectangle' returns if polyline and rectangle are intersecting", () => {
    const line1 = Geographic.fromDegreesArray([0, 0, 1, 1])
    const line2 = Geographic.fromDegreesArray([1, 1, 3, 3])
    const rect = Rectangle.fromDegrees(-2, -2, 2, 2)
    const intersect1 = Figure.polylineIntersectRectangle(line1, rect)
    const intersect2 = Figure.polylineIntersectRectangle(line2, rect)
    expect(intersect1).toBe(false)
    expect(intersect2).toBe(true)
  })

  it("method 'calcBearing' returns the bearing of two points", () => {
    const point1 = new Geographic(0, 0)
    const point2 = new Geographic(1, 0)
    const bearing = Figure.calcBearing(point1, point2)
    expect(bearing).toBe(90)
  })

  it("method 'calcRhumbBearing' returns the rhumb bearing of two points", () => {
    const point1 = new Geographic(0, 0)
    const point2 = new Geographic(1, 0)
    const bearing = Figure.calcBearing(point1, point2)
    expect(bearing).toBe(90)
  })

  it("method 'calcAngle' returns the angle of two lines", () => {
    const a = new Geographic(0, 0)
    const b = new Geographic(1, 0)
    const c = new Geographic(0, 1)
    const angle = Figure.calcAngle(a, b, c)
    expect(angle).toBe(90)
  })

  it("method 'calcMassCenter' returns the mass center of the polygon", () => {
    const polygon = Geographic.fromDegreesArray([0, 0, 0, 2, 2, 2, 2, 0, 0, 0])
    const center = Figure.calcMassCenter(polygon)
    expect(center.longitude).toBe(1)
    expect(center.latitude).toBe(1)
  })

  it("method 'calcMathDistance' returns math distance of an polyline array", () => {
    const line = [
      [0, 0],
      [0, 1],
      [0, 3],
    ]
    const distance = Figure.calcMathDistance(line)
    expect(distance).toBe(3)
  })

  it("method 'calcAzimuth' returns the azimuth of two points", () => {
    const azimuth = Figure.calcAzimuth([0, 0], [1, 1])
    expect(azimuth).toBe(Math.PI / 4)
  })

  it("method 'calcMathAngle' returns the math angle made of three points", () => {
    const angle = Figure.calcMathAngle([1, 0], [0, 0], [0, 1])
    expect(angle).toBe(Math.PI / 2)
  })
})
