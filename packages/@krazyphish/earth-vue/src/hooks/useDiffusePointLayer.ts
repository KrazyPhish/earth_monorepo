import { DiffusePointLayer, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default <T>(earthRef: ShallowRef<Earth | null>) => {
  const layerRef = shallowRef<DiffusePointLayer<T> | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    layerRef.value = new DiffusePointLayer<T>(earthRef.value)
  })

  onUnmounted(() => {
    layerRef.value?.destroy()
    layerRef.value = null
  })

  return layerRef
}
