/* eslint-disable vue/one-component-per-file */
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, expect, test, vi } from 'vitest'
import { defineComponent, watch } from 'vue'
import userEvent from '@testing-library/user-event'
import * as z from 'zod'
import { useZorm } from '../src'

afterEach(() => {
  cleanup()
})

function createComponentWithSchema(opts: {
  template: string
  schema?: z.ZodSchema
}) {
  const finalSchema = opts.schema ?? z.object({
    thing: z.string().min(1),
  })
  const App = defineComponent({
    setup() {
      const zo = useZorm('form', finalSchema)

      return {
        zo,
      }
    },
    template: opts.template,
  })

  return App
}

test('single field validation', async () => {
  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input :name="zo.fields.thing()" />
        <div v-if="zo.errors.thing()" data-testid="error">{{ zo.errors.thing().code }}</div>
      </form>
    `,
  })

  render(App)

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')?.textContent).toBe('too_small')
})

test('first blur does not trigger error', async () => {
  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input data-testid="input" :name="zo.fields.thing()" />
        <div v-if="zo.errors.thing()" data-testid="error">error</div>
        <div v-else data-testid="ok">ok</div>
      </form>
    `,
  })

  render(App)

  await fireEvent.blur(screen.getByTestId('input'))

  expect(screen.queryByTestId('ok')?.textContent).toBe('ok')
})

test('form is validated on blur after the first submit', async () => {
  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input data-testid="input" :name="zo.fields.thing()" />
        <div v-if="zo.errors.thing()" data-testid="error">error</div>
        <div v-else data-testid="ok">ok</div>
      </form>
    `,
  })

  render(App)

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')?.textContent).toBe('error')

  await userEvent.type(screen.getByTestId('input'), 'content')
  await fireEvent.blur(screen.getByTestId('input'))

  expect(screen.queryByTestId('ok')?.textContent).toBe('ok')
})

test('form data is validated', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const spy = vi.fn()

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema)

      watch(() => zo.validation, (val) => {
        if (val?.success)
          spy(val.data)
      })

      return {
        zo,
      }
    },
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input data-testid="input" :name="zo.fields.thing()" />
      </form>
    `,
  })

  render(App)

  await userEvent.type(screen.getByTestId('input'), 'content')
  await fireEvent.submit(screen.getByTestId('form'))

  expect(spy).toHaveBeenCalledWith({ thing: 'content' })
})
