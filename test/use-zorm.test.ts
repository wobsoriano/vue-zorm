/* eslint-disable vue/one-component-per-file */
import { fireEvent, render, screen } from '@testing-library/vue'
import { expect, test, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { defineComponent, watchEffect } from 'vue'
import * as z from 'zod'
import { useZorm } from '../src'

test('single field validation', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const { getRef, fields, errors } = useZorm('form', Schema)

      return {
        getRef,
        fields,
        errors,
      }
    },
    template: `
      <form data-testid="form" :ref="getRef">
        <input :name="fields.thing()" />
        <div v-if="errors.thing()" data-testid="error">{{ errors.thing().code }}</div>
      </form>
    `,
  })

  const wrapper = render(App)

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')?.textContent).toBe('too_small')

  wrapper.unmount()
})

test('first blur does not trigger error', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const { getRef, fields, errors } = useZorm('form', Schema)

      return {
        getRef,
        fields,
        errors,
      }
    },
    template: `
      <form data-testid="form" :ref="getRef">
        <input data-testid="input" :name="fields.thing()" />
        <div v-if="errors.thing()" data-testid="error">error</div>
        <div v-else data-testid="ok">ok</div>
      </form>
    `,
  })

  const wrapper = render(App)

  await fireEvent.blur(screen.getByTestId('input'))

  expect(screen.queryByTestId('ok')?.textContent).toBe('ok')

  wrapper.unmount()
})

test('form is validated on blur after the first submit', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const { getRef, fields, errors } = useZorm('form', Schema)

      watchEffect(() => {
        console.log('zxc', errors.value.thing())
      })

      return {
        getRef,
        fields,
        errors,
      }
    },
    template: `
      <form data-testid="form" :ref="getRef">
        <input data-testid="input" :name="fields.thing()" />
        <div v-if="errors.thing()" data-testid="error">error</div>
        <div v-else data-testid="ok">ok</div>
      </form>
    `,
  })

  const wrapper = render(App)

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')?.textContent).toBe('error')

  await userEvent.type(screen.getByTestId('input'), 'content')
  await fireEvent.blur(screen.getByTestId('input'))

  console.log(wrapper.html())

  expect(screen.queryByTestId('ok')?.textContent).toBe('ok')
})

// test('form data is validated', async () => {
//   const Schema = z.object({
//     thing: z.string().min(1),
//   })

//   const spy = vi.fn()

//   const App = defineComponent({
//     setup() {
//       const { getRef, fields, errors } = useZorm('form', Schema)

//       return {
//         getRef,
//         fields,
//         errors,
//       }
//     },
//     template: `
//       <form data-testid="form" :ref="getRef">
//         <input data-testid="input" :name="fields.thing()" />
//       </form>
//     `,
//   })

//   render(App)

//   await userEvent.type(screen.getByTestId('input'), 'content')
//   fireEvent.submit(screen.getByTestId('form'))

//   expect(spy).toHaveBeenCalledWith({ thing: 'content' })
// })
