/* eslint-disable vue/one-component-per-file */
import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineComponent } from 'vue'
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
      <form :ref="getRef">
        <input :name="fields.thing()" />
        <div v-if="errors.thing()" data-testid="error">{{ errors.thing().code }}</div>
      </form>
    `,
  })

  const wrapper = mount(App)

  await wrapper.trigger('submit')

  expect((await wrapper.find('[data-testid="error"]')).text()).toBe('too_small')
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
      <form :ref="getRef">
        <input :name="fields.thing()" />
        <div v-if="errors.thing()" data-testid="error">error</div>
        <div v-else data-testid="ok">ok</div>
      </form>
    `,
  })

  const wrapper = mount(App)

  await wrapper.trigger('blur')

  expect((await wrapper.find('[data-testid="ok"]')).text()).toBe('ok')
})
