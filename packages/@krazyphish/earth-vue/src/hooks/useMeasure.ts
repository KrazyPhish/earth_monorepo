import { Measure, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>) => {
  const measureRef = shallowRef<Measure | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    measureRef.value = new Measure(earthRef.value)
  })

  onUnmounted(() => {
    measureRef.value?.destroy()
    measureRef.value = null
  })

  return measureRef
}
