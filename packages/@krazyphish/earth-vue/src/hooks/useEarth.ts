import { createEarth, recycleEarth, Utils, type Earth } from "@krazyphish/earth"
import type { Viewer } from "cesium"
import { onMounted, onUnmounted, shallowRef, type Ref, type ShallowRef } from "vue"

type ShallowableRef<T> = Ref<T> | ShallowRef<T>
type Nullable<T> = T | undefined | null

export default (
  containerRef: ShallowableRef<Nullable<HTMLDivElement>>,
  cesiumOptions?: Viewer.ConstructorOptions,
  options?: Earth.ConstructorOptions
) => {
  const earthRef = shallowRef<Earth | null>(null)
  const id = Utils.uuid()

  onMounted(() => {
    if (!containerRef.value) return
    earthRef.value = createEarth(id, containerRef.value, cesiumOptions, options)
  })

  onUnmounted(() => {
    recycleEarth(id)
  })

  return earthRef
}
