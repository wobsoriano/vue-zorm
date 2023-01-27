import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, nextTick, ref } from 'vue'
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

test('can transform value', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema)
      const value = useValue({
        name: zo.fields.thing(),
        zorm: zo,
        transform(value) {
          return value.toUpperCase()
        },
      })

      return {
        zo,
        value,
      }
    },
    template: `
    <form data-testid="form" :ref="zo.getRef">
      <input data-testid="input" :name="zo.fields.thing()" defaultValue="value" />
      <div data-testid="value">{{ value }}</div>
    </form>
  `,
  })

  render(App)

  await nextTick()

  expect(screen.queryByTestId('value')).toHaveTextContent('VALUE')
})

test('can transform custom type', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema)
      const value = useValue({
        name: zo.fields.thing(),
        zorm: zo,
        initialValue: 0,
        transform(value) {
          return value.length
        },
      })

      assertNotAny(value.value)

      return {
        zo,
        value,
      }
    },
    template: `
    <form data-testid="form" :ref="zo.getRef">
      <input data-testid="input" :name="zo.fields.thing()" defaultValue="value" />
      <div data-testid="value">{{ typeof value }}</div>
    </form>
  `,
  })

  render(App)

  expect(screen.queryByTestId('value')).toHaveTextContent('number')
})

test('can read lazily rendered value', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema)
      const showInput = ref(false)

      const value = useValue({
        name: zo.fields.thing(),
        zorm: zo,
        initialValue: 'initialvalue',
      })

      return {
        zo,
        value,
        showInput,
      }
    },
    template: `
    <form data-testid="form" :ref="zo.getRef">
      <input v-if="showInput" data-testid="input" :name="zo.fields.thing()" />
      <button type="button" @click="showInput = true">show</button>
      <div data-testid="value">{{ value }}</div>
    </form>
  `,
  })

  render(App)

  expect(screen.queryByTestId('value')).toHaveTextContent('initialvalue')

  await fireEvent.click(screen.getByText('show'))

  await userEvent.type(screen.getByTestId('input'), 'typed value')

  expect(screen.queryByTestId('value')).toHaveTextContent('typed value')
})

test('can read lazily rendered default value', async () => {
  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema)
      const showInput = ref(false)

      const value = useValue({
        name: zo.fields.thing(),
        zorm: zo,
        initialValue: 'initialvalue',
      })

      return {
        zo,
        value,
        showInput,
      }
    },
    template: `
    <form data-testid="form" :ref="zo.getRef">
      <input v-if="showInput" data-testid="input" :name="zo.fields.thing()" defaultValue="defaultvalue" />
      <button type="button" @click="showInput = true">show</button>
      <div data-testid="value">{{ value }}</div>
    </form>
  `,
  })

  render(App)

  await fireEvent.click(screen.getByText('show'))

  // XXX requires change simulation to be picked up
  const event = new Event('input', {
    bubbles: true,
    cancelable: true,
  })

  screen.getByTestId('input').dispatchEvent(event)

  await nextTick()

  expect(screen.queryByTestId('value')).toHaveTextContent('defaultvalue')
})
