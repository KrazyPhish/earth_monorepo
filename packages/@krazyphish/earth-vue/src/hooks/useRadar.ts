import { Radar, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default <T>(earthRef: ShallowRef<Earth | null>) => {
  const radarRef = shallowRef<Radar | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    radarRef.value = new Radar<T>(earthRef.value)
  })

  onUnmounted(() => {
    radarRef.value?.destroy()
    radarRef.value = null
  })

  return radarRef
}
