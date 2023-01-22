# vue-zorm

Type-safe `<form>` for Vue using [Zod](https://github.com/colinhacks/zod)!

Vue port of [react-zorm](https://github.com/esamattis/react-zorm).

Features / opinions

-   Type-safe
    -   Get form data as a typed object
    -   Typo-safe `name` and `id` attribute generation
-   Simple nested object and array fields
    -   And still type-safe!
-   Validation on the client [and the server](#server-side-validation)
    -   With [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) or JSON
    -   Eg. works with any JavaScript backend
    -   Nuxt, vite-plugin-ssr, Express, Node.js, CF Workers, Deno etc.
-   Tiny: Less than 5kb (minified & gzipped)
    -   Tree shakes to be even smaller!
    -   No dependencies, only peer deps for Vue and Zod
-   No controlled inputs or context providers required
    -   The form is validated directly from the `<form>` DOM element
    -   As performant as Vue form libraries can get!

## Install

```bash
npm install zod vue-zorm
```

## Example

```html
<script setup lang="ts">
import { computed } from 'vue'
import { useZorm } from 'vue-zorm'
import { z } from 'zod'

const FormSchema = z.object({
  name: z.string().min(1),
  age: z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number),
})

const zo = useZorm('signup', FormSchema, {
  onValidSubmit(e) {
    e.preventDefault()
    console.log(`Form ok!\n${JSON.stringify(e.data, null, 2)}`)
  },
})

const disabled = computed(() => zo.validation?.success === false)
</script>

<template>
  <form :ref="zo.getRef">
    Name:
    <input
      type="text"
      :name="zo.fields.name()"
      :class="zo.errors.name('errored')"
    >
    <p v-if="zo.errors.name()">{{ zo.errors.name()?.code }}</p>
    Age: 
    <input
      type="text"
      :name="zo.fields.age()"
      :class="zo.errors.age('errored')"
    >
    <div v-if="zo.errors.age()">{{ zo.errors.age()?.code }}</div>
    <button :disabled="disabled" type="submit">
      Sign up!
    </button>
    <pre>Validation status: {{ JSON.stringify(zo.validation, null, 2) }}</pre>
  </form>
</template>
```

Also checkout [this classic TODOs example](https://vue-zorm-todo.vercel.app/) demonstrating almost every feature in the library. The code is [here](https://github.com/wobsoriano/vue-zorm/tree/main/dev).

## Nested data

### Objects

Create a Zod type with a nested object

```ts
const FormSchema = z.object({
  user: z.object({
    email: z.string().min(1),
    password: z.string().min(8),
  }),
})
```

and just create the input names with `.user.`:

```html
<input type="text" :name="zo.fields.user.email()" />
<input type="password" :name="zo.fields.user.password()" />
```

### Arrays

Array of user objects for example:

```ts
const FormSchema = z.object({
  users: z.array(
    z.object({
      email: z.string().min(1),
      password: z.string().min(8),
    }),
  ),
})
```

and put the array index to `users(index)`:

```html
<div v-for="(user, index) in users" :key="index">
  <input type="text" :name="zo.fields.users(index).email()">
  <input type="password" :name="zo.fields.users(index).password()">
</div>
```

And all this is type checked 👌

## Server-side validation

This is Nuxt but Vue Zorm does not actually use any Nuxt APIs so this method can be adapted to any JavaScript based server.

```ts
import { parseForm } from 'vue-zorm'

export default eventHandler(async (event) => {
  const form = await readBody(event)
  // Get parsed and typed form object. This throws on validation errors.
  const data = parseForm(FormSchema, form)
})
```

### Server-side field errors

The `useZorm()` composable can take in any additional `ZodIssue`s via the `customIssues` option:

```ts
const zo = useZorm('signup', FormSchema, {
  customIssues: [
    {
      code: 'custom',
      path: ['username'],
      message: 'The username is already in use',
    },
  ],
})
```

These issues can be generated anywhere. Most commonly on the server. The error chain will render these issues on the matching paths just like the errors coming from the schema.

To make their generation type-safe vue-zorm exports `createCustomIssues()` chain to make it easy:

```ts
const issues = createCustomIssues(FormSchema)

issues.username('Username already in use')

const zo = useZorm('signup', FormSchema, {
  customIssues: issues.toArray(),
})
```

## FAQ

### When Zorm validates?

When the form submits and on input blurs after the first submit attempt.

If you want total control over this, pass in `setupListeners: false` and call `validate()` manually when you need. Note that now you need to manually prevent submitting when the form is invalid.

```vue
<script setup lang="ts">
import { FormSchema } from 'path/to/schema'
import { useZorm } from 'vue-zorm'

const zo = useZorm('signup', FormSchema, { setupListeners: false })

function onSubmit(e) {
  const validation = zo.validate()

  if (!validation.success)
    e.preventDefault()
}
</script>

<template>
  <form :ref="zo.getRef" @submit="onSubmit">
    <!-- ... -->
  </form>
</template>
```

## License

MIT
