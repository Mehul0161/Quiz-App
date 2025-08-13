<template>
	<div class="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
		<div class="max-w-6xl mx-auto">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-float">🎮 Game Setup</h1>
				<p class="text-lg text-neutral-400">Choose your challenge and become a millionaire!</p>
			</div>

			<!-- Login Required -->
			<div v-if="!userStore.isLoggedIn" class="card text-center mb-8 border-2 border-red-500/30 bg-red-500/5">
				<div class="text-6xl mb-4 animate-float">🔒</div>
				<h2 class="text-2xl font-bold text-white mb-3">Access Required</h2>
				<p class="text-neutral-300 mb-6 text-lg">Ready to win $1,000,000? Login to start your journey!</p>
				<router-link to="/login" class="btn-primary px-8 py-3 text-lg font-bold">
					🚀 Login / Register
				</router-link>
			</div>

			<!-- Game Setup Form -->
			<div v-else class="space-y-8">
				<!-- Game Mode Selection -->
				<div class="card border-2 border-neutral-700">
					<div class="text-center mb-6">
						<h2 class="text-3xl font-bold text-white mb-2">🎯 Choose Your Challenge</h2>
						<p class="text-neutral-400">Each mode offers a unique experience and different rewards</p>
					</div>
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div
							v-for="mode in gameModes"
							:key="mode.id"
							@click="selectedMode = mode.id"
							:class="selectedMode === mode.id ? 'border-indigo-500 bg-indigo-600/20 shadow-indigo-500/20 shadow-lg animate-glow' : 'border-neutral-600 hover:border-indigo-400 hover:bg-indigo-600/10'"
							class="p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg transform group"
						>
							<div class="flex items-start gap-4">
								<div class="text-4xl group-hover:scale-110 transition-transform duration-300">{{ mode.icon }}</div>
								<div class="flex-1">
									<h3 class="font-bold text-white text-xl mb-2">{{ mode.name }}</h3>
									<p class="text-neutral-300 text-sm mb-3 leading-relaxed">{{ mode.description }}</p>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span class="text-xs text-neutral-500">Difficulty:</span>
											<span class="text-sm font-bold px-2 py-1 rounded-full" :class="getDifficultyBadgeClass(mode.difficulty)">
												{{ mode.difficulty }}
											</span>
										</div>
										<div v-if="selectedMode === mode.id" class="text-indigo-400 text-xl animate-pulse">✓</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Category Selection (only show if mode is selected) -->
				<div v-if="selectedMode" class="card border-2 border-neutral-700">
					<div class="text-center mb-6">
						<h2 class="text-2xl font-bold text-white mb-2">📚 Pick Your Domain</h2>
						<p class="text-neutral-400">Choose the category that excites you most</p>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						<button
							v-for="category in categories"
							:key="category"
							@click="selectedCategory = category"
							:class="selectedCategory === category ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 shadow-lg shadow-indigo-500/25 scale-105' : 'bg-neutral-800/80 border-neutral-600 hover:bg-neutral-700/80 hover:border-indigo-400 hover:scale-105'"
							class="p-4 rounded-xl border-2 text-center transition-all duration-300 transform hover:shadow-lg group"
						>
							<div class="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
								{{ getCategoryIcon(category) }}
							</div>
							<span class="font-bold text-white text-sm">{{ category }}</span>
						</button>
					</div>
				</div>

				<!-- Game Rules for Selected Mode -->
				<div v-if="selectedMode" class="card mb-6">
					<h3 class="text-lg font-bold text-white mb-3">Mode Rules</h3>
					<div class="space-y-3 text-sm text-neutral-300">
						<div v-if="selectedMode === 'rapidfire'">
							<p><strong>⚡ Rapid Fire Mode:</strong> Answer questions quickly with a time limit. No lifelines available.</p>
							<ul class="list-disc list-inside ml-4 space-y-1">
								<li>15 seconds per question</li>
								<li>No lifelines</li>
								<li>Double points for quick answers</li>
								<li>Progressive difficulty</li>
							</ul>
						</div>
						<div v-else-if="selectedMode === 'normal'">
							<p><strong>🎯 Normal Mode:</strong> Classic quiz experience with all features.</p>
							<ul class="list-disc list-inside ml-4 space-y-1">
								<li>30 seconds per question</li>
								<li>3 lifelines available</li>
								<li>Standard scoring</li>
								<li>Progressive difficulty</li>
							</ul>
						</div>
						<div v-else-if="selectedMode === 'nooptions'">
							<p><strong>❓ Without Options Mode:</strong> Type your answers without multiple choice.</p>
							<ul class="list-disc list-inside ml-4 space-y-1">
								<li>45 seconds per question</li>
								<li>No lifelines</li>
								<li>Bonus points for exact matches</li>
								<li>Partial credit for close answers</li>
							</ul>
						</div>
						<div v-else-if="selectedMode === 'imagebased'">
							<p><strong>🖼️ Image Based Mode:</strong> Questions based on images and visual content.</p>
							<ul class="list-disc list-inside ml-4 space-y-1">
								<li>40 seconds per question</li>
								<li>2 lifelines available</li>
								<li>Visual recognition skills</li>
								<li>Mixed question types</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Start Game Button -->
				<div v-if="selectedMode && selectedCategory" class="text-center">
					<div class="card border-2 border-green-500/30 bg-green-500/5 mb-6">
						<div class="text-center">
							<div class="text-4xl mb-3 animate-float">🚀</div>
							<h3 class="text-xl font-bold text-white mb-2">Ready to Play?</h3>
							<p class="text-neutral-300 mb-4">
								<strong>{{ getSelectedModeName() }}</strong> in <strong>{{ selectedCategory }}</strong>
							</p>
							<button @click="startGame" :disabled="loading" class="btn-primary px-10 py-4 text-xl font-bold hover:scale-110 transform transition-all duration-300 animate-glow">
								<LoadingSpinner v-if="loading" text="Starting your journey..." />
								<span v-else>🎮 Start Game & Win $1M!</span>
							</button>
						</div>
					</div>
				</div>

				<div v-if="error" class="card border-2 border-red-500/50 bg-red-500/10 text-center">
					<div class="text-3xl mb-2">⚠️</div>
					<p class="text-red-300 font-semibold">{{ error }}</p>
				</div>
			</div>

			<!-- General Game Rules -->
			<div class="card">
				<h3 class="text-lg font-bold text-white mb-3">General Rules</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
					<div>
						<h4 class="font-semibold text-white mb-2">Game Structure</h4>
						<ul class="list-disc list-inside space-y-2 text-neutral-300">
							<li>15 questions with increasing difficulty</li>
							<li>Prize ladder from $100 to $1,000,000</li>
							<li>Walk away anytime to keep your winnings</li>
							<li>Different time limits per mode</li>
						</ul>
					</div>
					<div>
						<h4 class="font-semibold text-white mb-2">Lifelines (Normal Mode)</h4>
						<ul class="list-disc list-inside space-y-2 text-neutral-300">
							<li><strong>50:50:</strong> Remove two wrong answers</li>
							<li><strong>Audience:</strong> See audience poll results</li>
							<li><strong>Friend:</strong> Get advice from a friend</li>
						</ul>
					</div>
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
