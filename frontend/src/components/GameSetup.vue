<template>
	<div class="min-h-screen bg-neutral-950 p-4">
		<div class="max-w-4xl mx-auto">
			<!-- Header -->
			<div class="text-center mb-6">
				<h1 class="text-2xl md:text-3xl font-bold text-white mb-2">🎮 Game Setup</h1>
				<p class="text-sm text-neutral-400">Choose your challenge and become a millionaire!</p>
			</div>

			<!-- Login Required -->
			<div v-if="!userStore.isLoggedIn" class="card text-center mb-6 border-2 border-red-500/30 bg-red-500/5">
				<div class="text-4xl mb-2">🔒</div>
				<h2 class="text-lg font-bold text-white mb-2">Access Required</h2>
				<p class="text-neutral-300 mb-4 text-sm">Ready to win $1,000,000? Login to start your journey!</p>
				<router-link to="/login" class="btn-primary px-6 py-2 text-sm font-medium">
					🚀 Login / Register
				</router-link>
			</div>

			<!-- Game Setup Form -->
			<div v-else class="space-y-6">
				<!-- Game Mode Selection -->
				<div class="card border-2 border-neutral-700">
					<div class="text-center mb-4">
						<h2 class="text-lg font-bold text-white mb-1">🎯 Choose Your Challenge</h2>
						<p class="text-neutral-400 text-xs">Each mode offers a unique experience and different rewards</p>
					</div>
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<div
							v-for="mode in gameModes"
							:key="mode.id"
							@click="selectedMode = mode.id"
							:class="selectedMode === mode.id ? 'border-indigo-500 bg-indigo-600/20' : 'border-neutral-600 hover:border-indigo-400 hover:bg-indigo-600/10'"
							class="p-4 rounded-lg border-2 cursor-pointer transition-colors duration-200 hover:scale-[1.02] group"
						>
							<div class="flex items-start gap-3">
								<div class="text-3xl group-hover:scale-110 transition-transform duration-200">{{ mode.icon }}</div>
								<div class="flex-1">
									<h3 class="font-bold text-white text-base mb-1">{{ mode.name }}</h3>
									<p class="text-neutral-300 text-xs mb-2 leading-relaxed">{{ mode.description }}</p>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-1">
											<span class="text-xs text-neutral-500">Difficulty:</span>
											<span class="text-xs font-bold px-2 py-1 rounded-full" :class="getDifficultyBadgeClass(mode.difficulty)">
												{{ mode.difficulty }}
											</span>
										</div>
										<div v-if="selectedMode === mode.id" class="text-indigo-400 text-lg">✓</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Category Selection (only show if mode is selected) -->
				<div v-if="selectedMode" class="card border-2 border-neutral-700">
					<div class="text-center mb-4">
						<h2 class="text-lg font-bold text-white mb-1">📚 Pick Your Domain</h2>
						<p class="text-neutral-400 text-xs">Choose the category that excites you most</p>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
						<button
							v-for="category in categories"
							:key="category"
							@click="selectedCategory = category"
							:class="selectedCategory === category ? 'bg-indigo-600 border-indigo-500' : 'bg-neutral-800/80 border-neutral-600 hover:bg-neutral-700/80 hover:border-indigo-400'"
							class="p-3 rounded-lg border-2 text-center transition-colors duration-200 hover:scale-105 group"
						>
							<div class="text-xl mb-1 group-hover:scale-110 transition-transform duration-200">
								{{ getCategoryIcon(category) }}
							</div>
							<span class="font-bold text-white text-xs">{{ category }}</span>
						</button>
					</div>
				</div>

				<!-- Game Rules for Selected Mode -->
				<div v-if="selectedMode" class="card mb-4">
					<h3 class="text-base font-bold text-white mb-2">Mode Rules</h3>
					<div class="space-y-2 text-xs text-neutral-300">
						<div v-if="selectedMode === 'rapidfire'">
							<p><strong>⚡ Rapid Fire Mode:</strong> Answer questions quickly with a time limit. No lifelines available.</p>
							<ul class="list-disc list-inside ml-3 space-y-1">
								<li>15 seconds per question</li>
								<li>No lifelines</li>
								<li>Double points for quick answers</li>
								<li>Progressive difficulty</li>
							</ul>
						</div>
						<div v-else-if="selectedMode === 'normal'">
							<p><strong>🎯 Normal Mode:</strong> Classic quiz experience with all features.</p>
							<ul class="list-disc list-inside ml-3 space-y-1">
								<li>30 seconds per question</li>
								<li>3 lifelines available</li>
								<li>Standard scoring</li>
								<li>Progressive difficulty</li>
							</ul>
						</div>
						<div v-else-if="selectedMode === 'nooptions'">
							<p><strong>🧠 No Options Mode:</strong> Test your knowledge without multiple choice.</p>
							<ul class="list-disc list-inside ml-3 space-y-1">
								<li>Type your answers</li>
								<li>No lifelines</li>
								<li>Triple points for correct answers</li>
								<li>Progressive difficulty</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Start Game Button -->
				<div v-if="selectedMode && selectedCategory" class="text-center">
					<button @click="startGame" class="btn-primary px-8 py-3 text-base font-medium">
						🚀 Start Game
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useQuizStore } from '../stores/quiz'
import LoadingSpinner from './LoadingSpinner.vue'

const router = useRouter()
const userStore = useUserStore()
const quizStore = useQuizStore()

const selectedMode = ref('')
const selectedCategory = ref('')
const loading = ref(false)
const error = ref('')

const gameModes = [
	{
		id: 'normal',
		name: 'Normal Mode',
		description: 'Classic quiz experience with lifelines and standard timing',
		icon: '🎯',
		difficulty: 'Medium'
	},
	{
		id: 'rapidfire',
		name: 'Rapid Fire',
		description: 'Fast-paced questions with time pressure and no lifelines',
		icon: '⚡',
		difficulty: 'Hard'
	},
	{
		id: 'nooptions',
		name: 'Without Options',
		description: 'Type your answers without multiple choice options',
		icon: '❓',
		difficulty: 'Very Hard'
	},
	{
		id: 'imagebased',
		name: 'Image Based',
		description: 'Visual questions based on images and visual content',
		icon: '🖼️',
		difficulty: 'Hard'
	}
]

const categories = computed(() => quizStore.categories)



const getDifficultyBadgeClass = (difficulty: string) => {
	switch (difficulty) {
		case 'Easy': return 'bg-green-500/20 text-green-300 border border-green-500/30'
		case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
		case 'Hard': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
		case 'Very Hard': return 'bg-red-500/20 text-red-300 border border-red-500/30'
		default: return 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30'
	}
}

const getCategoryIcon = (category: string) => {
	const icons: { [key: string]: string } = {
		'Science': '🔬',
		'History': '🏛️',
		'Geography': '🌍',
		'Sports': '⚽',
		'Entertainment': '🎭',
		'Technology': '💻',
		'Literature': '📚',
		'Art': '🎨',
		'Music': '🎵',
		'Movies': '🎬',
		'General Knowledge': '🧠',
		'Nature': '🌿',
		'Space': '🚀',
		'Food': '🍽️',
		'Animals': '🦁'
	}
	return icons[category] || '📖'
}

const getSelectedModeName = () => {
	const mode = gameModes.find(m => m.id === selectedMode.value)
	return mode ? mode.name : 'Game'
}

const startGame = async () => {
	if (!selectedMode.value || !selectedCategory.value) {
		error.value = 'Please select both a game mode and category'
		return
	}

	loading.value = true
	error.value = ''

	try {
		await quizStore.startQuiz(selectedCategory.value, selectedMode.value)
		router.push('/game')
	} catch (err) {
		error.value = 'Failed to start game. Please try again.'
		console.error('Error starting game:', err)
	} finally {
		loading.value = false
	}
}
</script>
