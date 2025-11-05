<template>
	<div class="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-4 sm:p-6">
		<div class="max-w-4xl mx-auto">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3"><Gamepad2 :size="40" /> Choose Your Challenge</h1>
				<p class="text-neutral-400">Pick a mode and category to get started</p>
			</div>

			<!-- Step 1: Game Mode Selection -->
			<div class="mb-8">
				<h2 class="text-xl font-bold text-white mb-4">1. Select Game Mode</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<button
						v-for="mode in Object.values(GAME_MODES)"
						:key="mode.id"
						@click="selectedMode = mode.id"
						:class="[
							'p-6 rounded-xl border-2 transition duration-300 text-left group',
							selectedMode === mode.id
								? 'border-indigo-500 bg-indigo-600/20'
								: 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/40'
						]"
					>
						<div class="mb-3 group-hover:scale-125 transition inline-block">
							<component :is="getGameModeIcon(mode.id)" :size="48" class="text-indigo-400" />
						</div>
						<h3 class="font-bold text-white text-lg mb-1">{{ mode.name }}</h3>
						<p class="text-neutral-400 text-sm mb-3">{{ mode.description }}</p>
						<div class="flex items-center gap-2 flex-wrap">
							<span class="text-xs px-2 py-1 rounded-full bg-yellow-600/20 text-yellow-300">
								{{ mode.difficulty }}
							</span>
							<span class="text-xs text-neutral-500 flex items-center gap-1"><Clock :size="12" /> {{ mode.timeLimit }}s</span>
							<span v-if="mode.lifelines > 0" class="text-xs text-neutral-500 flex items-center gap-1"><Brain :size="12" /> {{ mode.lifelines }} lifelines</span>
						</div>
					</button>
				</div>
			</div>

			<!-- Step 2: Category Selection -->
			<div v-if="selectedMode" class="mb-8">
				<h2 class="text-xl font-bold text-white mb-4">2. Pick Your Category</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					<button
						v-for="category in categories"
						:key="category"
						@click="selectedCategory = category"
						:class="[
							'p-4 rounded-lg border-2 transition text-center group',
							selectedCategory === category
								? 'border-indigo-500 bg-indigo-600/20'
								: 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/40'
						]"
					>
						<div class="mb-2 group-hover:scale-125 transition inline-block flex justify-center">
							<component :is="getCategoryIcon(category)" :size="32" class="text-indigo-400" />
						</div>
						<div class="text-sm font-medium text-white">{{ category }}</div>
					</button>
				</div>
			</div>

			<!-- Step 3: Mode Info & Start -->
			<div v-if="selectedMode && selectedCategory" class="bg-neutral-800/40 border border-neutral-700 rounded-xl p-6 mb-8">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h3 class="font-bold text-white mb-1 text-lg">{{ GAME_MODES[selectedMode as keyof typeof GAME_MODES]?.name }}</h3>
						<p class="text-neutral-400 text-sm">{{ selectedCategory }}</p>
					</div>
					<div><component :is="getCategoryIcon(selectedCategory)" :size="32" class="text-indigo-400" /></div>
				</div>

				<div class="bg-neutral-900/50 rounded-lg p-4 mb-6">
					<h4 class="font-semibold text-white text-sm mb-3">Game Details:</h4>
					<ul class="space-y-2">
						<li v-for="detail in GAME_MODES[selectedMode as keyof typeof GAME_MODES]?.details" :key="detail" class="flex items-start gap-2 text-sm text-neutral-300">
							<Check :size="16" class="text-indigo-400 mt-0.5 flex-shrink-0" />
							<span>{{ detail }}</span>
						</li>
					</ul>
				</div>

				<div class="flex gap-3">
					<button
						@click="startGame"
						:disabled="appStore.loading"
						class="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						<span v-if="appStore.loading">
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						</span>
						<span v-else><Rocket :size="18" /></span>
						<span>{{ appStore.loading ? 'Starting...' : 'Start Game' }}</span>
					</button>
					<button
						@click="reset"
						class="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-lg transition"
					>
						Reset
					</button>
				</div>

				<div v-if="appStore.error" class="mt-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg text-red-300 text-sm">
					{{ appStore.error }}
				</div>
			</div>

			<!-- Prize Structure Reference -->
			<div class="bg-neutral-800/30 border border-neutral-700 rounded-xl p-6">
				<h3 class="font-bold text-white mb-4 text-lg flex items-center gap-2"><Coins :size="20" /> Prize Ladder</h3>
				<div class="grid grid-cols-5 md:grid-cols-10 gap-2">
					<div v-for="(prize, idx) in prizeStructure" :key="idx" class="text-center">
						<div class="text-xs text-neutral-400 mb-1">Q{{ idx + 1 }}</div>
						<div class="text-xs font-bold text-yellow-400">{{ formatCurrency(prize) }}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { GAME_MODES, formatCurrency } from '../utils/constants'
import { getCategoryIcon, getGameModeIcon } from '../utils/icons'
import { Gamepad2, Coins, Clock, Brain, Rocket, Check } from 'lucide-vue-next'

const router = useRouter()
const appStore = useAppStore()

const selectedMode = ref('')
const selectedCategory = ref('')

const categories = computed(() => appStore.categories.length > 0 ? appStore.categories : ['General Knowledge', 'Science & Technology', 'History', 'Geography', 'Entertainment', 'Sports', 'Literature', 'Mathematics'])
const prizeStructure = computed(() => appStore.prizeStructure.length > 0 ? appStore.prizeStructure : [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000])

onMounted(() => {
  if (appStore.categories.length === 0) {
    appStore.fetchCategories()
  }
  if (appStore.prizeStructure.length === 0) {
    appStore.fetchPrizeStructure()
  }
})

const startGame = async () => {
	if (!selectedMode.value || !selectedCategory.value) return
	try {
		await appStore.startQuiz(selectedCategory.value, selectedMode.value)
		// Only navigate if quiz started successfully
		if (appStore.questions && appStore.questions.length > 0) {
			router.push('/game')
		} else {
			console.error('Questions not available after startQuiz, not navigating')
		}
	} catch (err) {
		// Error is set in store - don't navigate on error
		console.error('Failed to start quiz:', err)
	}
}

const reset = () => {
	selectedMode.value = ''
	selectedCategory.value = ''
	appStore.error = ''
}
</script>
