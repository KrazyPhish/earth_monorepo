import { WindField, type Earth } from "@krazyphish/earth"
import { useEffect, useRef, type RefObject } from "react"

export default (earthRef: RefObject<Earth | null>, options: WindField.ConstructorOptions) => {
  const fieldRef = useRef<WindField | null>(null)

  useEffect(() => {
    if (!earthRef.current) return
    fieldRef.current = new WindField(earthRef.current, options)
  }, [])

  return fieldRef
}
