import { Weather, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>) => {
  const weatherRef = shallowRef<Weather | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    weatherRef.value = new Weather(earthRef.value)
  })

  onUnmounted(() => {
    weatherRef.value?.destroy()
    weatherRef.value = null
  })

  return weatherRef
}
