import { 
  Target, Zap, PenTool, Brain, FlaskConical, BookOpen, Globe, 
  Film, Activity, Book, Calculator, Palette, Newspaper,
  Home, BarChart3, Trophy, User, Lock, LogOut, Menu,
  Coins, Play, ArrowRight, X, Award, TrendingUp, Gamepad2,
  DollarSign, Crown, Medal, Star, CheckCircle, XCircle,
  Clock, HelpCircle, Users, Phone, MessageCircle
} from 'lucide-vue-next'

// Icon mapping for game modes
export const GAME_MODE_ICONS = {
  normal: Target,
  rapidfire: Zap,
  nooptions: PenTool,
  default: Gamepad2
}

// Icon mapping for categories
export const CATEGORY_ICONS: Record<string, any> = {
  'General Knowledge': Brain,
  'Science & Technology': FlaskConical,
  'History': BookOpen,
  'Geography': Globe,
  'Entertainment': Film,
  'Sports': Activity,
  'Literature': Book,
  'Mathematics': Calculator,
  'Art & Culture': Palette,
  'Current Affairs': Newspaper
}

// Navigation icons
export const NAV_ICONS = {
  home: Home,
  dashboard: BarChart3,
  leaderboard: Trophy,
  profile: User,
  signin: Lock,
  logout: LogOut,
  menu: Menu
}

// General icons
export const ICONS = {
  coins: Coins,
  play: Play,
  arrowRight: ArrowRight,
  close: X,
  award: Award,
  trendingUp: TrendingUp,
  gamepad: Gamepad2,
  dollar: DollarSign,
  crown: Crown,
  medal: Medal,
  star: Star,
  check: CheckCircle,
  xcircle: XCircle,
  clock: Clock,
  help: HelpCircle,
  users: Users,
  phone: Phone,
  message: MessageCircle
}

// Helper to get icon component
export const getGameModeIcon = (mode: string) => {
  return GAME_MODE_ICONS[mode as keyof typeof GAME_MODE_ICONS] || GAME_MODE_ICONS.default
}

export const getCategoryIcon = (category: string) => {
  return CATEGORY_ICONS[category] || Brain
}

