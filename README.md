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
    -   No dependencies, only peer deps for React and Zod
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

## License

MIT
