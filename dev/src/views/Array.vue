<script setup lang="ts">
import { computed } from 'vue'
import { useZorm } from 'vue-zorm'
import { z } from 'zod'

const users = [
  { email: '', password: '' },
  { email: '', password: '' },
  { email: '', password: '' },
]

const FormSchema = z.object({
  users: z.array(
    z.object({
      email: z.string().min(1),
      password: z.string().min(8),
    }),
  ),
})

const zo = useZorm('signup', FormSchema, {
  onValidSubmit(e) {
    e.preventDefault()
    // eslint-disable-next-line no-console
    console.log(`Form ok!\n${JSON.stringify(e.data, null, 2)}`)
  },
})

const disabled = computed(() => zo.validation?.success === false)
</script>

<template>
  <div>
    <form :ref="zo.getRef">
      <template v-for="(user, index) in users" :key="user">
        <input type="text" :name="zo.fields.users(index).email()">
        <input type="password" :name="zo.fields.users(index).password()">
        <br><br>
      </template>
      <button :disabled="disabled" type="submit">
        Sign up!
      </button>
      <pre>Validation status: {{ JSON.stringify(zo.validation, null, 2) }}</pre>
    </form>
  </div>
</template>
