import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, watch } from 'vue'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import * as z from 'zod'
import { createCustomIssues, useZorm } from '../src'

afterEach(() => {
  cleanup()
})

type IsAny<T> = unknown extends T ? (T extends {} ? T : never) : never

type NotAny<T> = T extends IsAny<T> ? never : T

function assertNotAny<T>(_x: NotAny<T>) {}

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

  expect(screen.queryByTestId('error')).toHaveTextContent('too_small')
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

  expect(screen.queryByTestId('ok')).toHaveTextContent('ok')
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

  expect(screen.queryByTestId('error')).toHaveTextContent('error')

  await userEvent.type(screen.getByTestId('input'), 'content')
  await fireEvent.blur(screen.getByTestId('input'))

  expect(screen.queryByTestId('ok')).toHaveTextContent('ok')
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

test('class name shortcut', async () => {
  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input data-testid="input" :name="zo.fields.thing()" :class="zo.errors.thing('errored')" />
      </form>
    `,
  })

  render(App)

  expect(screen.queryByTestId('input')).not.toHaveClass('errored')

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('input')).toHaveClass('errored')
})

test('can get the validation object', async () => {
  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input :name="zo.fields.thing()" />
        <div data-testid="error">{{ zo.errors.thing()?.code }}</div>
      </form>
    `,
  })

  render(App)

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')).toHaveTextContent('too_small')
})

test('can validate multiple dependent fields', async () => {
  const Schema = z.object({
    password: z
      .object({
        pw1: z.string(),
        pw2: z.string(),
      })
      .refine(
        (pw) => {
          return pw.pw1 === pw.pw2
        },
        { message: 'passwords to not match' },
      ),
  })

  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input :data-testid="zo.fields.password.pw1('id')" :name="zo.fields.password.pw1()" />
        <input :data-testid="zo.fields.password.pw2('id')" :name="zo.fields.password.pw2()" />
        <div data-testid="error">{{ zo.errors.password()?.message }}</div>
      </form>
    `,
    schema: Schema,
  })

  render(App)

  await userEvent.type(screen.getByTestId('form:password.pw1'), 'foo')
  await userEvent.type(screen.getByTestId('form:password.pw2'), 'bar')

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')).toHaveTextContent(
    'passwords to not match',
  )
})

test('can validate multiple dependent root fields', async () => {
  const Schema = z
    .object({
      pw1: z.string(),
      pw2: z.string(),
    })
    .refine(
      (pw) => {
        return pw.pw1 === pw.pw2
      },
      { message: 'passwords to not match' },
    )

  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input :data-testid="zo.fields.pw1('id')" :name="zo.fields.pw1()" />
        <input :data-testid="zo.fields.pw2('id')" :name="zo.fields.pw2()" />
        <div data-testid="error">{{ zo.errors()?.message }}</div>
      </form>
    `,
    schema: Schema,
  })

  render(App)

  await userEvent.type(screen.getByTestId('form:pw1'), 'foo')
  await userEvent.type(screen.getByTestId('form:pw2'), 'bar')

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')).toHaveTextContent(
    'passwords to not match',
  )
})

test('can parse array of strings', async () => {
  const Schema = z.object({
    strings: z.array(z.string().min(2)),
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
        <input :name="zo.fields.strings(0)('name')" defaultValue="ding" />
        <input :name="zo.fields.strings(1)('name')" defaultValue="dong" />
      </form>
    `,
  })

  render(App)

  await fireEvent.submit(screen.getByTestId('form'))

  expect(spy).toHaveBeenCalledWith({ strings: ['ding', 'dong'] })
})

test('can validate array of strings on individual items', async () => {
  const Schema = z.object({
    strings: z.array(z.string().min(2)),
  })

  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input :name="zo.fields.strings(0)('name')" defaultValue="ding" />
        <input :name="zo.fields.strings(1)('name')" defaultValue="d" />
        <div data-testid="error">{{ zo.errors.strings(1)()?.message }}</div>
      </form>
    `,
    schema: Schema,
  })

  render(App)

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')).toHaveTextContent(
    'String must contain at least 2 character(s)',
  )
})

test('can validate array of strings', async () => {
  const Schema = z.object({
    strings: z.array(z.string()).min(2),
  })

  const App = createComponentWithSchema({
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input :name="zo.fields.strings(0)('name')" defaultValue="ding" />
        <div data-testid="error">{{ zo.errors.strings()?.message }}</div>
      </form>
    `,
    schema: Schema,
  })

  render(App)

  await fireEvent.submit(screen.getByTestId('form'))

  expect(screen.queryByTestId('error')).toHaveTextContent(
    'Array must contain at least 2 element(s',
  )
})

test('onValidSubmit is called on first valid submit', async () => {
  const spy = vi.fn()

  const Schema = z.object({
    thing: z.string().min(1),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema, {
        onValidSubmit(e) {
          spy(e.data)
        },
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

test('onValidSubmit is not called on error submit', async () => {
  const spy = vi.fn()

  const Schema = z.object({
    thing: z.string().min(10),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema, {
        onValidSubmit(e) {
          assertNotAny(e.data)
          assertNotAny(e.data.thing)

          // @ts-expect-error: TODO
          e.data.bad

          spy()
        },
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

  await userEvent.type(screen.getByTestId('input'), 'short')
  await fireEvent.submit(screen.getByTestId('form'))
  expect(spy).toHaveBeenCalledTimes(0)

  await userEvent.type(
    screen.getByTestId('input'),
    'looooooooooooooooooooooong',
  )
  await fireEvent.submit(screen.getByTestId('form'))
  expect(spy).toHaveBeenCalledTimes(1)
})

test('setupListeners: false', async () => {
  const spy = vi.fn()

  const Schema = z.object({
    thing: z.string().min(10),
  })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema, {
        setupListeners: false,
        onValidSubmit() {
          spy()
        },
      })

      return {
        zo,
      }
    },
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input data-testid="input" :name="zo.fields.thing()" />
        <div data-testid="status">{{ zo.errors.thing() ? 'error' : 'ok' }}</div>
      </form>
    `,
  })

  render(App)

  // Does not update ok status to error because no listeners
  await userEvent.type(screen.getByTestId('input'), 'short')
  await fireEvent.submit(screen.getByTestId('form'))
  expect(spy).toHaveBeenCalledTimes(0)
  expect(screen.getByTestId('status')).toHaveTextContent('ok')

  // No change here
  await userEvent.type(
    screen.getByTestId('input'),
    'looooooooooooooooooooooong',
  )
  await fireEvent.blur(screen.getByTestId('input'))
  expect(screen.getByTestId('status')).toHaveTextContent('ok')

  // Or here
  await fireEvent.submit(screen.getByTestId('form'))
  expect(spy).toHaveBeenCalledTimes(0)
})

test('checkbox arrays', async () => {
  const spy = vi.fn()

  interface Color {
    name: string
    code: string
  }

  const FormSchema = z.object({
    colors: z
      .array(z.string().nullish())
      .transform(a => a.flatMap(item => (item || []))),
  })

  const App = defineComponent({
    setup() {
      const COLORS: Color[] = [
        {
          name: 'Red',
          code: 'red',
        },
        {
          name: 'Green',
          code: 'green',
        },
        {
          name: 'Blue',
          code: 'blue',
        },
      ]

      const zo = useZorm('form', FormSchema, {
        onValidSubmit(e) {
          e.preventDefault()
          spy(e.data)
        },
      })

      return {
        zo,
        COLORS,
      }
    },
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <div v-for="(color, index) in COLORS" :key="color.code">
          <input
            type="checkbox"
            :id="zo.fields.colors(index)('id')"
            :name="zo.fields.colors(index)('name')"
            :defaultChecked="index === 1"
            :value="color.code"
          />
          <label :htmlFor="zo.fields.colors(index)('id')">
            {{ color.name }}
          </label>
        </div>
      </form>
    `,
  })

  render(App)

  await fireEvent.submit(screen.getByTestId('form'))
  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy).toHaveBeenCalledWith({ colors: ['green'] })
})

test('can add custom issues', async () => {
  const Schema = z.object({
    thing: z.string(),
  })

  const issues = createCustomIssues(Schema)
  issues.thing('custom issue')

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema, {
        customIssues: issues.toArray(),
      })

      return {
        zo,
      }
    },
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input :name="zo.fields.thing()" />
        <div v-if="zo.errors.thing()" data-testid="error">{{ zo.errors.thing()?.message }}</div>
      </form>
    `,
  })

  render(App)

  expect(screen.queryByTestId('error')).toHaveTextContent('custom issue')
})

test('can add custom issues with params', async () => {
  const Schema = z.object({
    thing: z.string(),
  })

  const issues = createCustomIssues(Schema)
  issues.thing('custom issue', { my: 'thing' })

  const App = defineComponent({
    setup() {
      const zo = useZorm('form', Schema, {
        customIssues: issues.toArray(),
      })

      return {
        zo,
      }
    },
    template: `
      <form data-testid="form" :ref="zo.getRef">
        <input :name="zo.fields.thing()" />
        <div v-if="zo.errors.thing() && zo.errors.thing()?.code === 'custom'" data-testid="error">
          {{ zo.errors.thing()?.params?.my }}
        </div>
      </form>
    `,
  })

  render(App)

  expect(screen.queryByTestId('error')).toHaveTextContent('thing')
})

// More tests
// https://github.com/esamattis/react-zorm/blob/master/packages/react-zorm/__tests__/use-zorm.test.tsx#L600
