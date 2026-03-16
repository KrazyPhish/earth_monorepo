/* eslint-disable @typescript-eslint/no-explicit-any */
import { useImageryProvider } from "@/hooks"
import type { WindField } from "@anstec/earth"
import { useEarth, useWindField } from "@anstec/earth-react"
import { NetCDFReader } from "netcdfjs"
import { useRef, type FC } from "react"

const loadData = () => {
  const arrayToMap = (array: { name: string; size: number }[]) => {
    return array.reduce(
      (prev, curr) => {
        prev[curr.name] = curr
        return prev
      },
      {} as { [key: string]: any }
    )
  }

  const data = {} as WindField.Data
  const request = new XMLHttpRequest()
  request.open("GET", "/WindFieldData.nc")
  request.responseType = "arraybuffer"
  return new Promise<WindField.Data>((resolve) => {
    request.onload = () => {
      const netCdf = new NetCDFReader(request.response)
      const dimensions = arrayToMap(netCdf.dimensions)
      const vectors = arrayToMap(netCdf.variables)
      data.dimensions = {
        lon: dimensions["lon"].size,
        lat: dimensions["lat"].size,
        lev: dimensions["lev"].size,
      }
      const dimensionNames = ["lon", "lat", "lev"] as const
      dimensionNames.forEach((key) => {
        const array = new Float32Array(netCdf.getDataVariable(key).flat() as number[])
        data[key] = {
          array,
          min: Math.min(...array),
          max: Math.max(...array),
        }
      })
      const vectorNames = ["U", "V"] as const
      vectorNames.forEach((key) => {
        const array = new Float32Array(netCdf.getDataVariable(key).flat() as number[])
        data[key] = {
          array,
          min: arrayToMap(vectors[key].attributes)["min"].value,
          max: arrayToMap(vectors[key].attributes)["max"].value,
        }
      })
      resolve(data)
    }
    request.send()
  })
}

const data = await loadData()

const Field: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const earthRef = useEarth(containerRef)
  useImageryProvider(earthRef)
  useWindField(earthRef, { data })
  return (
    <>
      <div ref={containerRef} className="w-full h-full"></div>
    </>
  )
}

export default Field
