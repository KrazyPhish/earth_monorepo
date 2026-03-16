import type { Earth } from "@anstec/earth"
import { ArcGISTiledElevationTerrainProvider } from "cesium"
import { useEffect, type RefObject } from "react"

export const useTerrainProvider = (earthRef: RefObject<Earth | null>) => {
  useEffect(() => {
    if (!earthRef.current) return
    ArcGISTiledElevationTerrainProvider.fromUrl(
      "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
    ).then((provider) => {
      earthRef.current!.setTerrain(provider)
    })
  }, [])
}
