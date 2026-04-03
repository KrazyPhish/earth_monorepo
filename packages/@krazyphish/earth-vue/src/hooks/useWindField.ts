import { WindField, type Earth } from "@krazyphish/earth"
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue"

export default (earthRef: ShallowRef<Earth | null>, options: WindField.ConstructorOptions) => {
  const fieldRef = shallowRef<WindField | null>(null)

  onMounted(() => {
    if (!earthRef.value) return
    fieldRef.value = new WindField(earthRef.value, options)
  })

  onUnmounted(() => {
    fieldRef.value?.destroy()
    fieldRef.value = null
  })

  return fieldRef
}
