// UI Theme Constants
export const COLORS = {
  primary: {
    light: 'indigo-600',
    dark: 'indigo-700',
    bg: 'indigo-600/20',
    border: 'indigo-600/30',
    text: 'indigo-400'
  },
  success: {
    light: 'green-600',
    dark: 'green-700',
    bg: 'green-600/20',
    border: 'green-600/30',
    text: 'green-400'
  },
  warning: {
    light: 'yellow-600',
    dark: 'yellow-700',
    bg: 'yellow-600/20',
    border: 'yellow-600/30',
    text: 'yellow-400'
  },
  danger: {
    light: 'red-600',
    dark: 'red-700',
    bg: 'red-600/20',
    border: 'red-600/30',
    text: 'red-400'
  },
  accent: {
    light: 'purple-600',
    dark: 'purple-700',
    bg: 'purple-600/20',
    border: 'purple-600/30',
    text: 'purple-400'
  }
}

// Game modes configuration (no hardcoded data - will be fetched from API if needed)
export const GAME_MODES = {
  normal: {
    id: 'normal',
    name: 'Normal Mode',
    description: 'Classic experience with lifelines',
    timeLimit: 30,
    lifelines: 3,
    difficulty: 'Medium',
    color: 'primary',
    entryFee: 20000,
    details: [
      '30 seconds per question',
      '3 lifelines: 50:50, Audience, Friend',
      'Standard prize-based scoring',
      'Safe havens at $32K and $1M'
    ]
  },
  rapidfire: {
    id: 'rapidfire',
    name: 'Rapid Fire',
    description: 'Fast-paced with no lifelines',
    timeLimit: 90,
    lifelines: 0,
    difficulty: 'Hard',
    color: 'accent',
    entryFee: 15000,
    details: [
      '15 seconds per question',
      'No lifelines',
      '+5 points correct, -3 wrong',
      'Continuous until time runs out'
    ]
  },
  nooptions: {
    id: 'nooptions',
    name: 'Without Options',
    description: 'Type answers, no multiple choice',
    timeLimit: 45,
    lifelines: 0,
    difficulty: 'Very Hard',
    color: 'danger',
    entryFee: 30000,
    details: [
      '45 seconds per question',
      'Type your exact answer',
      '1.5x bonus for correct answers',
      'Acceptable synonyms allowed'
    ]
  }
}

export const DIFFICULTY_LEVELS = {
  easy: { label: 'Easy', bg: 'green-600/20', text: 'green-300' },
  medium: { label: 'Medium', bg: 'yellow-600/20', text: 'yellow-300' },
  hard: { label: 'Hard', bg: 'orange-600/20', text: 'orange-300' },
  'very hard': { label: 'Very Hard', bg: 'red-600/20', text: 'red-300' }
} as Record<string, { label: string; bg: string; text: string }>

export const RANK_BADGES = {
  1: { bg: 'yellow-600', text: 'yellow-100' },
  2: { bg: 'gray-400', text: 'gray-900' },
  3: { bg: 'amber-700', text: 'amber-100' }
} as Record<number, { bg: string; text: string }>

// Formatting utilities
export const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`
export const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const getAverageScore = (earnings: number, gamesPlayed: number) => {
  return gamesPlayed > 0 ? Math.round(earnings / gamesPlayed) : 0
}


