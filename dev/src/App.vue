<script setup lang="ts">
import { computed, ref } from 'vue'
import { useZorm } from 'vue-zorm'
import { FormSchema } from './schema'
import TodoItem from './TodoItem.vue'
import RenderError from './RenderError.vue'

const zo = useZorm('signup', FormSchema, {
  onValidSubmit(e) {
    e.preventDefault()
    // eslint-disable-next-line no-alert
    alert(JSON.stringify(e.data, null, 2))
  },
})

const canSubmit = computed(() => zo.validation?.success !== false)

const todos = ref(1)
const addTodo = () => todos.value++

const range = computed(() => Array(todos.value).fill(0).map((_, i) => i))
</script>

<template>
  <form :ref="zo.getRef">
    <h1>Todo list</h1>
    List name
    <input
      type="text"
      :name="zo.fields.meta.listName()"
      :class="zo.errors.meta.listName('errored')"
    >
    <component :is="zo.errors.meta.listName(RenderError)" />
    <h2>Todos</h2>
    <TodoItem
      v-for="(_r, index) in range"
      :key="index"
      :index="index"
      :zorm="zo"
    />
    <button type="button" @click="addTodo">
      Add todo
    </button>
    <button :disabled="!canSubmit" type="submit">
      Submit all
    </button>
    <pre>
        Validation status: {{ JSON.stringify(zo.validation, null, 2) }}
    </pre>
  </form>
</template>

<style>
button[type="submit"] {
  margin-top: 2rem;
  padding: 1rem;
}
fieldset {
  margin: 1rem;
}

.errored {
  border: 4px solid red;
}

.error-message {
  font-size: small;
  color: red;
}

input,
button {
  display: block;
}
</style>
