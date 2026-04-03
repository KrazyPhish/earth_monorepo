import { describe, expect, it } from "vitest"
import { CoorFormat, Utils } from "../../src"

describe("unit test for util class: Utils", () => {
  it("properties or methods on Utils cannot be reassigned", () => {
    expect(() => {
      Utils.uuid = (symbol: string) => symbol
    }).toThrowError()
  })

  it("method 'uuid' generate a random uuid but cannot accept symbol of string 'Ω' and 'x'", () => {
    expect(() => Utils.uuid("Ω")).toThrowError()
    expect(() => Utils.uuid("x")).toThrowError()
  })

  it("method 'encode' encode an id with a module name", () => {
    expect(() => Utils.encode("Ω", "Custom")).toThrowError()
    expect(Utils.encode("Id", "Custom")).toBe("IdΩCustom")
  })

  it("method 'decode' decode the encoded id with module and its origin id", () => {
    const decodeId = Utils.decode("IdΩCustom")
    expect(decodeId.id).toBe("Id")
    expect(decodeId.module).toBe("Custom")
  })

  it("method 'formatGeoLongitude' returns a formatted string of provided longitude", () => {
    const lon1 = Utils.formatGeoLongitude(23.55)
    const lon2 = Utils.formatGeoLongitude(23.55, CoorFormat.DMSS)
    expect(lon1).toBe("23°33′0″E")
    expect(lon2).toBe("233300E")
  })

  it("method 'formatGeoLatitude' returns a formatted string of provided latitude", () => {
    const lat1 = Utils.formatGeoLatitude(23.55)
    const lat2 = Utils.formatGeoLatitude(23.55, CoorFormat.DMSS)
    expect(lat1).toBe("23°33′0″N")
    expect(lat2).toBe("233300N")
  })

  it("method 'singleton' returns a proxy of the class that can only construct one instance", () => {
    class Test {}
    const ProxyTest = Utils.singleton(Test)
    const pt1 = new ProxyTest()
    const pt2 = new ProxyTest()
    expect(pt1).instanceOf(Test)
    expect(pt2).toBe(pt1)
  })
})
