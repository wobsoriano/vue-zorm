<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <div class="error-message">
    {{ message }}
  </div>
</template>
