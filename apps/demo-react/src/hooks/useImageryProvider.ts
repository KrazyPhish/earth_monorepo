import type { Earth } from "@anstec/earth"
import { ArcGisMapServerImageryProvider } from "cesium"
import { useEffect, type RefObject } from "react"

export const useImageryProvider = (earthRef: RefObject<Earth | null>) => {
  useEffect(() => {
    if (!earthRef.current) return
    ArcGisMapServerImageryProvider.fromUrl(
      "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer"
    ).then((provider) => {
      earthRef.current!.addImageryProvider(provider)
    })
  }, [])
}
