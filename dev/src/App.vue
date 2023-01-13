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
  <div>
    <form :ref="getRef">
      Name: <input type="text" :name="fields.name()" :class="errors.name('errored')">
      <div v-if="errors.name()">
        error: {{ errors.name()?.code }}
      </div>
      Age: <input type="text" :name="fields.age()" :class="errors.age('errored')">
      <div v-if="errors.age()">
        error: {{ errors.age()?.code }}
      </div>
      <button :disabled="disabled" type="submit">
        Sign up!
      </button>
      <pre>Validation status: {{ JSON.stringify(validation, null, 2) }}</pre>
    </form>
  </div>
</template>
