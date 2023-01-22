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
  <div>
    <form :ref="zo.getRef">
      Name: <input type="text" :name="zo.fields.name()" :class="zo.errors.name('errored')">
      <div v-if="zo.errors.name()">
        error: {{ zo.errors.name()?.code }}
      </div>
      Age: <input type="text" :name="zo.fields.age()" :class="zo.errors.age('errored')">
      <div v-if="zo.errors.age()">
        error: {{ zo.errors.age()?.code }}
      </div>
      <button :disabled="disabled" type="submit">
        Sign up!
      </button>
      <pre>Validation status: {{ JSON.stringify(zo.validation, null, 2) }}</pre>
    </form>
  </div>
</template>
