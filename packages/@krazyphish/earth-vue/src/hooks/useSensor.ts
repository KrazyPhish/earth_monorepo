import { Sensor, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default <T>(earthRef: ShallowRef<Earth | null>) => {
  const sensorRef = shallowRef<Sensor<T> | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    sensorRef.value = new Sensor<T>(earthRef.value)
  })

  onUnmounted(() => {
    sensorRef.value?.destroy()
    sensorRef.value = null
  })

  return sensorRef
}
