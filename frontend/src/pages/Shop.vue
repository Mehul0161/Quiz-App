<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">Shop</h1>
        <p class="text-neutral-400">Purchase cosmetics and items with your earnings</p>
      </div>

      <!-- Your Earnings -->
      <div class="mb-8 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-neutral-400 text-sm">Your Earnings</p>
            <p class="text-3xl font-bold text-yellow-400">{{ formatCurrency(userEarnings) }}</p>
          </div>
          <div class="text-right">
            <p class="text-neutral-400 text-sm">Items Owned</p>
            <p class="text-3xl font-bold text-indigo-400">{{ inventory.length }}</p>
          </div>
        </div>
      </div>

      <!-- Categories Filter -->
      <div class="mb-8 flex gap-2 flex-wrap">
        <button 
          @click="selectedCategory = null"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all duration-200',
            selectedCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          ]"
        >
          All Items
        </button>
        <button 
          v-for="category in categories"
          :key="category"
          @click="selectedCategory = category"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize',
            selectedCategory === category
              ? 'bg-indigo-600 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          ]"
        >
          {{ category }}
        </button>
      </div>

      <!-- Shop Items Grid -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-neutral-400">Loading items...</p>
      </div>

      <div v-else-if="filteredItems.length === 0" class="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-xl">
        <p class="text-neutral-400">No items available in this category</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="item in filteredItems"
          :key="item._id"
          class="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-indigo-500 transition-all duration-200"
        >
          <!-- Item Image -->
          <div class="w-full h-40 bg-neutral-800 flex items-center justify-center overflow-hidden">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover">
            <div v-else class="text-neutral-600">No Image</div>
          </div>

          <!-- Item Info -->
          <div class="p-4">
            <h3 class="font-bold text-white mb-1 line-clamp-2">{{ item.name }}</h3>
            <p class="text-neutral-400 text-xs mb-3 line-clamp-2">{{ item.description }}</p>

            <!-- Rarity Badge -->
            <div class="mb-3">
              <span :class="[
                'inline-block px-2 py-1 rounded text-xs font-bold capitalize',
                getRarityColor(item.rarity)
              ]">
                {{ item.rarity }}
              </span>
            </div>

            <!-- Price -->
            <div class="mb-4 text-lg font-bold text-yellow-400">
              {{ formatCurrency(item.price) }}
            </div>

            <!-- Purchase Button -->
            <button 
              @click="purchaseItem(item)"
              :disabled="!canPurchase(item)"
              class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 text-sm"
            >
              {{ getPurchaseButtonText(item) }}
            </button>

            <p v-if="!canPurchase(item)" class="text-red-400 text-xs mt-2 text-center">
              {{ getPurchaseErrorMessage(item) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/appStore'
import { formatCurrency } from '@/utils/constants'
import axios from 'axios'

const appStore = useAppStore()
const loading = ref(false)
const items = ref<any[]>([])
const inventory = ref<any[]>([])
const selectedCategory = ref<string | null>(null)
const categories = ref<string[]>([])

const userEarnings = computed(() => appStore.currentUser?.totalEarnings || 0)

const filteredItems = computed(() => {
  if (!selectedCategory.value) return items.value
  return items.value.filter(item => item.category === selectedCategory.value)
})

const canPurchase = (item: any) => {
  if (!appStore.isLoggedIn) return false
  if (userEarnings.value < item.price) return false
  if (isOwned(item._id)) return false
  return true
}

const isOwned = (itemId: string) => {
  return inventory.value.some(i => i.itemId === itemId)
}

const getRarityColor = (rarity: string) => {
  const colors: Record<string, string> = {
    common: 'bg-gray-600 text-white',
    uncommon: 'bg-blue-600 text-white',
    rare: 'bg-purple-600 text-white',
    epic: 'bg-pink-600 text-white',
    legendary: 'bg-yellow-600 text-white'
  }
  return colors[rarity] || 'bg-neutral-700 text-white'
}

const getPurchaseButtonText = (item: any) => {
  if (!appStore.isLoggedIn) return 'Sign In to Buy'
  if (isOwned(item._id)) return 'Owned'
  if (userEarnings.value < item.price) return 'Insufficient Earnings'
  return 'Purchase'
}

const getPurchaseErrorMessage = (item: any) => {
  if (isOwned(item._id)) return 'Already owned'
  if (userEarnings.value < item.price) {
    const needed = item.price - userEarnings.value
    return `Need ${formatCurrency(needed)} more`
  }
  return ''
}

const purchaseItem = async (item: any) => {
  try {
    loading.value = true
    const response = await axios.post(
      '/api/shop/purchase',
      { itemId: item._id },
      { headers: { Authorization: `Bearer ${appStore.token}` } }
    )
    
    // Update user earnings
    appStore.currentUser!.totalEarnings = response.data.wallet.totalEarnings
    
    // Refresh inventory
    await fetchInventory()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to purchase item')
  } finally {
    loading.value = false
  }
}

const fetchItems = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/shop/items?limit=100')
    items.value = response.data.items
    
    // Extract unique categories
    const cats = new Set(response.data.items.map((item: any) => item.category))
    categories.value = Array.from(cats) as string[]
  } catch (error) {
    console.error('Error fetching items:', error)
  } finally {
    loading.value = false
  }
}

const fetchInventory = async () => {
  try {
    if (!appStore.isLoggedIn) return
    const response = await axios.get('/api/shop/inventory', {
      headers: { Authorization: `Bearer ${appStore.token}` }
    })
    inventory.value = response.data.items
  } catch (error) {
    console.error('Error fetching inventory:', error)
  }
}

onMounted(() => {
  fetchItems()
  fetchInventory()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
