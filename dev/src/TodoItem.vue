<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { Zorm } from 'vue-zorm'
import RenderError from './RenderError.vue'
import type { FormSchema } from './schema'

const props = defineProps({
  zorm: {
    type: Object as PropType<Zorm<typeof FormSchema>>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})

const todoError = computed(() => props.zorm.errors.todos(props.index))
const todoField = computed(() => props.zorm.fields.todos(props.index))
</script>

<template>
  <fieldset>
    Task
    <input
      type="text"
      :name="todoField.task()"
      :class="todoError.task('errored')"
    >
    <component :is="todoError.task(RenderError)" />
    Priority
    <input
      type="text"
      :name="todoField.priority()"
      :class="todoError.priority('errored')"
    >
    <component :is="todoError.priority(RenderError)" />
  </fieldset>
</template>
