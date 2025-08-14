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
						<div v-else-if="selectedMode === 'imagebased'">
							<p><strong>🖼️ Image Based Mode:</strong> Questions based on images and visual content.</p>
							<ul class="list-disc list-inside ml-3 space-y-1">
								<li>Visual recognition skills</li>
								<li>2 lifelines available</li>
								<li>Mixed question types</li>
								<li>Progressive difficulty</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Start Game Button -->
				<div v-if="selectedMode && selectedCategory" class="text-center">
					<button @click="testServer" class="btn-secondary px-4 py-2 text-sm font-medium mb-2">
						🔧 Test Server Connection
					</button>
					<button @click="testQuiz" class="btn-secondary px-4 py-2 text-sm font-medium mb-2">
						🧪 Test Quiz Generation
					</button>
					<button @click="startGame" :disabled="loading" class="btn-primary px-8 py-3 text-base font-medium">
						<span v-if="loading" class="flex items-center gap-2">
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							Generating AI Questions...
						</span>
						<span v-else>🚀 Start Game</span>
					</button>
					<p v-if="loading" class="text-xs text-neutral-400 mt-2">
						AI is creating fresh questions for you...
					</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const userStore = useUserStore()
const quizStore = useQuizStore()

const selectedMode = ref('')
const selectedCategory = ref('')
const loading = ref(false)
const error = ref<string | null>('')

const gameModes = [
	{
		id: 'normal',
		name: 'Normal Mode',
		description: 'Classic quiz experience with lifelines and standard timing',
		icon: '🎯',
		difficulty: 'medium'
	},
	{
		id: 'rapidfire',
		name: 'Rapid Fire',
		description: 'Fast-paced questions with time pressure and no lifelines',
		icon: '⚡',
		difficulty: 'hard'
	},
	{
		id: 'nooptions',
		name: 'Without Options',
		description: 'Type your answers without multiple choice options',
		icon: '❓',
		difficulty: 'very hard'
	},
	{
		id: 'imagebased',
		name: 'Image Based',
		description: 'Visual questions based on images and visual content',
		icon: '🖼️',
		difficulty: 'hard'
	}
]

const categories = [
	'General Knowledge',
	'Science',
	'History',
	'Geography',
	'Entertainment',
	'Sports',
	'Technology',
	'Art',
	'Music',
	'Literature'
]


const getDifficultyBadgeClass = (difficulty: string) => {
	switch (difficulty.toLowerCase()) {
		case 'easy':
			return 'bg-green-600/20 text-green-300 border-green-500/30'
		case 'medium':
			return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30'
		case 'hard':
			return 'bg-red-600/20 text-red-300 border-red-500/30'
		default:
			return 'bg-neutral-600/20 text-neutral-300 border-neutral-500/30'
	}
}

const getCategoryIcon = (category: string) => {
	const icons: Record<string, string> = {
		'General Knowledge': '🧠',
		'Science': '🔬',
		'History': '📚',
		'Geography': '🌍',
		'Entertainment': '🎬',
		'Sports': '⚽',
		'Technology': '💻',
		'Art': '🎨',
		'Music': '🎵',
		'Literature': '📖'
	}
	return icons[category] || '❓'
}

const startGame = async () => {
	if (!selectedMode.value || !selectedCategory.value) return
	
	try {
		loading.value = true
		error.value = null
		
		console.log('Starting quiz with:', { mode: selectedMode.value, category: selectedCategory.value })
		
		// Start the quiz using the quiz store
		await quizStore.startQuiz(selectedCategory.value, selectedMode.value)
		
		console.log('Quiz started successfully, navigating to game...')
		
		// Navigate to game after successfully starting quiz
		router.push('/game')
	} catch (err: any) {
		console.error('Error starting quiz:', err)
		error.value = err.message || 'Failed to start game'
	} finally {
		loading.value = false
	}
}

const testServer = async () => {
	try {
		const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/test`)
		const data = await response.json()
		
		console.log('Server test response:', data)
		alert(`Server Status: ${data.message}\nGemini API Key: ${data.geminiKey}\nTimestamp: ${data.timestamp}`)
	} catch (error) {
		console.error('Server test failed:', error)
		alert(`Server test failed: ${error.message}`)
	}
}

const testQuiz = async () => {
	if (!selectedMode.value || !selectedCategory.value) return
	
	try {
		const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/quizzes/test`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				category: selectedCategory.value,
				mode: selectedMode.value
			})
		})
		
		const data = await response.json()
		
		if (data.success !== false) {
			console.log('Test quiz response:', data)
			alert(`Test Quiz Generated!\nQuestions: ${data.totalQuestions}\nMode: ${data.mode}\nCategory: ${data.category}\n\nCheck console for details.`)
		} else {
			alert(`Test quiz failed: ${data.error}`)
		}
	} catch (error) {
		console.error('Test quiz failed:', error)
		alert(`Test quiz failed: ${error.message}`)
	}
}
</script>
