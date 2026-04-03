import { GlobalEvent, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>, delay?: number) => {
  const eventRef = shallowRef<GlobalEvent | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    eventRef.value = new GlobalEvent(earthRef.value, delay)
  })

  onUnmounted(() => {
    eventRef.value?.destroy()
    eventRef.value = null
  })

  return eventRef
}
