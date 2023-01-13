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
-   No controlled inputs or context providers required
    -   The form is validated directly from the `<form>` DOM element
    -   As performant as React form libraries can get!

## Install

```bash
npm install vue-zorm
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

const { getRef, validation, fields, errors } = useZorm('signup', FormSchema, {
  onValidSubmit(e) {
    e.preventDefault()
    console.log(`Form ok!\n${JSON.stringify(e.data, null, 2)}`)
  },
})

const disabled = computed(() => validation.value?.success === false)
</script>

<template>
  <form :ref="getRef">
    Name:
    <input
      type="text"
      :name="fields.name()"
      :class="errors.name('errored')"
    >
    <p v-if="errors.name()">{{ errors.name()?.code }}</p>
    Age: 
    <input
      type="text"
      :name="fields.age()"
      :class="errors.age('errored')"
    >
    <div v-if="errors.age()">{{ errors.age()?.code }}</div>
    <button :disabled="disabled" type="submit">
      Sign up!
    </button>
    <pre>Validation status: {{ JSON.stringify(validation, null, 2) }}</pre>
  </form>
</template>
```

## License

MIT
