<template>
	<div class="flex items-center justify-center gap-2">
		<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
		<span v-if="text" class="text-sm">{{ text }}</span>
	</div>
</template>

<script setup lang="ts">
defineProps({
	text: {
		type: String,
		default: ''
	}
})
</script>


