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

## Usage

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

## License

MIT
