import type { Ref } from 'vue'
import { ref, watchPostEffect } from 'vue'
import { isValuedElement } from './utils'

export interface ValueSubscription<T> {
  name: string
  zorm: {
    form: HTMLElement | null
  }
  initialValue?: T
  event?: string
  transform?: (value: string) => T
}

export function useValue<T>(
  opts: ValueSubscription<T>,
): undefined extends T ? Ref<string> : Ref<T> {
  const value = ref<any>(opts.initialValue ?? '')
  const mapRef = ref<((value: string) => T) | undefined>(opts.transform)

  watchPostEffect((onInvalidate) => {
    const form = opts.zorm.form
    if (!form)
      return

    const listener = (e: { target: {} | null }) => {
      const input = e.target

      if (!isValuedElement(input))
        return

      if (opts.name !== input.name)
        return

      if (mapRef.value)
        value.value = mapRef.value(input.value)
      else
        value.value = input.value ?? ''
    }

    const initialInput = form.querySelector(`[name="${opts.name}"]`)

    if (initialInput)
      listener({ target: initialInput })

    const event = opts.event ?? 'input'

    form.addEventListener(event, listener)

    onInvalidate(() => {
      form.removeEventListener(event, listener)
    })
  })

  return value
}
