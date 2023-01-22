import { type Ref, ref, unref, watchPostEffect } from 'vue'
import type { MaybeRef } from './types'
import { isValuedElement } from './utils'

export interface ValueSubscription<T> {
  name: MaybeRef<string>
  zorm: {
    refObject: Ref<HTMLElement>
  }
  initialValue?: T
  event?: MaybeRef<string>
  transform?: (value: string) => T
}

export function useValue<T>(
  opts: ValueSubscription<T>,
): undefined extends T ? string : T {
  const value = ref<any>(opts.initialValue ?? '')
  const mapRef = ref<((value: string) => T) | undefined>(opts.transform)

  watchPostEffect((onInvalidate) => {
    const form = opts.zorm.refObject.value
    if (!form)
      return

    const listener = (e: { target: {} | null }) => {
      const input = e.target

      if (!isValuedElement(input))
        return

      if (unref(opts.name) !== input.name)
        return

      if (mapRef.value)
        value.value(mapRef.value(input.value))
      else
        value.value(input.value ?? '')
    }

    const initialInput = form.querySelector(`[name="${unref(opts.name)}"]`)

    if (initialInput)
      listener({ target: initialInput })

    const event = unref(opts.event) ?? 'input'

    form.addEventListener(event, listener)

    onInvalidate(() => {
      form.removeEventListener(event, listener)
    })
  })

  return value
}
