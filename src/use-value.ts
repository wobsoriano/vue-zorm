import { type Ref, ref, watchPostEffect } from 'vue'
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

      if (opts.name !== input.name)
        return

      if (mapRef.value)
        value.value(mapRef.value(input.value))
      else
        value.value(input.value ?? '')
    }

    const initialInput = form.querySelector(`[name="${opts.name}"]`)

    if (initialInput)
      listener({ target: initialInput })

    const event = opts.event ?? 'input'

    // @ts-expect-error: TODO
    form.addEventListener(event, listener)

    onInvalidate(() => {
      // @ts-expect-error: TODO
      form.removeEventListener(event, listener)
    })
  })

  return value
}
