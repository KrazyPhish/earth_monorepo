import { Heatmap, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>, options?: Heatmap.ConstructorOptions) => {
  const heatmapRef = shallowRef<Heatmap | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    heatmapRef.value = new Heatmap(earthRef.value, options)
  })

  onUnmounted(() => {
    heatmapRef.value?.destroy()
    heatmapRef.value = null
  })

  return heatmapRef
}
