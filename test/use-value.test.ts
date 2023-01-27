import { cleanup, render, screen } from '@testing-library/vue'
import { defineComponent, nextTick } from 'vue'
import userEvent from '@testing-library/user-event'
import * as z from 'zod'
import { useValue, useZorm } from '../src'

afterEach(() => {
  cleanup()
})

type IsAny<T> = unknown extends T ? (T extends {} ? T : never) : never

type NotAny<T> = T extends IsAny<T> ? never : T

function assertNotAny<T>(_x: NotAny<T>) {}

test('can read value with useValue()', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema)
      const value = useValue({
        name: zo.fields.thing(),
        zorm: zo,
      })

      assertNotAny(value)

      return {
        zo,
        value,
      }
    },
    template: `
    <form data-testid="form" :ref="zo.getRef">
      <input data-testid="input" :name="zo.fields.thing()" />
      <div data-testid="value">{{ value }}</div>
    </form>
  `,
  })

  render(App)

  await userEvent.type(screen.getByTestId('input'), 'value1')

  expect(screen.queryByTestId('value')).toHaveTextContent('value1')

  await userEvent.type(screen.getByTestId('input'), 'value2')

  expect(screen.queryByTestId('value')).toHaveTextContent('value1value2')
})

test('renders default value', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema)
      const value = useValue({
        name: zo.fields.thing(),
        zorm: zo,
      })

      return {
        zo,
        value,
      }
    },
    template: `
    <form data-testid="form" :ref="zo.getRef">
      <input data-testid="input" :name="zo.fields.thing()" defaultValue="defaultvalue" />
      <div data-testid="value">{{ value }}</div>
    </form>
  `,
  })

  render(App)

  await nextTick()

  expect(screen.queryByTestId('value')).toHaveTextContent('defaultvalue')
})
