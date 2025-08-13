<template>
  <div class="flex items-center justify-center gap-2">
    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>
