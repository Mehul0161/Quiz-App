const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const GeminiService = require('./geminiService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini service
const geminiService = new GeminiService();

// Middleware
// Permissive CORS: allow all origins (no credentials). Safe for public JSON APIs
const corsOptions = {
  origin: true, // reflect request origin or '*' when no origin
  credentials: false, // required for '*' compatibility
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// In-memory database (for development - replace with real database in production)
let users = [];
let quizzes = [];
let questions = [];
let leaderboard = [];

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Initialize data directory and files
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Load existing data or create empty files
        try {
            users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
        } catch (error) {
            users = [];
            await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        }
        
        try {
            quizzes = JSON.parse(await fs.readFile(QUIZZES_FILE, 'utf8'));
        } catch (error) {
            quizzes = [];
            await fs.writeFile(QUIZZES_FILE, JSON.stringify(quizzes, null, 2));
        }
        
        try {
            questions = JSON.parse(await fs.readFile(QUESTIONS_FILE, 'utf8'));
        } catch (error) {
            questions = [];
            await fs.writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
        }
        
        try {
            leaderboard = JSON.parse(await fs.readFile(LEADERBOARD_FILE, 'utf8'));
        } catch (error) {
            leaderboard = [];
            await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
        }
        
        console.log('Data initialized successfully');
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// Save data functions
async function saveUsers() {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function saveQuizzes() {
    await fs.writeFile(QUIZZES_FILE, JSON.stringify(quizzes, null, 2));
}

async function saveQuestions() {
    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
}

async function saveLeaderboard() {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
}

// Quiz categories
const QUIZ_CATEGORIES = [
    'General Knowledge',
    'Science & Technology',
    'History',
    'Geography',
    'Sports',
    'Entertainment',
    'Literature',
    'Mathematics',
    'Art & Culture',
    'Current Affairs'
];

// Fallback quiz generation function
function generateFallbackQuestions(category) {
    const baseQuestions = {
        'General Knowledge': [
            {
                question: "What is the capital of France?",
                options: { A: "Berlin", B: "Madrid", C: "Paris", D: "Rome" },
                correct_answer: "C",
                difficulty_level: "easy",
                explanation: "Paris is the capital and most populous city of France.",
                lifelines: {
                    fifty_fifty: ["A", "D"],
                    audience_poll: { "A": "5%", "B": "10%", "C": "80%", "D": "5%" },
                    phone_a_friend: "I'm almost certain it's Paris."
                }
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: { A: "Venus", B: "Mars", C: "Jupiter", D: "Saturn" },
                correct_answer: "B",
                difficulty_level: "easy",
                explanation: "Mars is called the Red Planet due to its reddish appearance.",
                lifelines: {
                    fifty_fifty: ["A", "C"],
                    audience_poll: { "A": "10%", "B": "75%", "C": "10%", "D": "5%" },
                    phone_a_friend: "I think it's Mars, the red one."
                }
            },
            {
                question: "What is the largest ocean on Earth?",
                options: { A: "Atlantic", B: "Indian", C: "Arctic", D: "Pacific" },
                correct_answer: "D",
                difficulty_level: "easy",
                explanation: "The Pacific Ocean is the largest and deepest ocean on Earth.",
                lifelines: {
                    fifty_fifty: ["A", "C"],
                    audience_poll: { "A": "15%", "B": "10%", "C": "5%", "D": "70%" },
                    phone_a_friend: "Pacific is the biggest ocean, I'm sure."
                }
            }
        ],
        'History': [
            {
                question: "Who was the first President of the United States?",
                options: { A: "George Washington", B: "Thomas Jefferson", C: "Abraham Lincoln", D: "John Adams" },
                correct_answer: "A",
                difficulty_level: "easy",
                explanation: "George Washington was the first President of the United States.",
                lifelines: {
                    fifty_fifty: ["B", "D"],
                    audience_poll: { "A": "85%", "B": "8%", "C": "5%", "D": "2%" },
                    phone_a_friend: "Definitely George Washington, the first president."
                }
            },
            {
                question: "In which year did World War II end?",
                options: { A: "1944", B: "1945", C: "1946", D: "1947" },
                correct_answer: "B",
                difficulty_level: "easy",
                explanation: "World War II ended in 1945 with the surrender of Germany and Japan.",
                lifelines: {
                    fifty_fifty: ["A", "C"],
                    audience_poll: { "A": "5%", "B": "85%", "C": "8%", "D": "2%" },
                    phone_a_friend: "I think it was 1945, the war ended then."
                }
            }
        ],
        'Science & Technology': [
            {
                question: "What is the chemical symbol for gold?",
                options: { A: "Go", B: "Gd", C: "Au", D: "Ag" },
                correct_answer: "C",
                difficulty_level: "medium",
                explanation: "Au is the chemical symbol for gold, from the Latin 'aurum'.",
                lifelines: {
                    fifty_fifty: ["A", "B"],
                    audience_poll: { "A": "10%", "B": "15%", "C": "70%", "D": "5%" },
                    phone_a_friend: "Gold is Au, I remember that from chemistry."
                }
            }
        ]
    };
    
    const questions = baseQuestions[category] || baseQuestions['General Knowledge'];
    
    // Generate 15 questions by cycling through base questions
    const fullQuiz = [];
    for (let i = 0; i < 15; i++) {
        const baseQuestion = questions[i % questions.length];
        fullQuiz.push({
            ...baseQuestion,
            question_number: (i + 1).toString(),
            prize_amount: PRIZE_STRUCTURE[i].toString()
        });
    }
    
    return fullQuiz;
}

// Prize structure (in virtual currency)
const PRIZE_STRUCTURE = [
    100,    // Question 1
    200,    // Question 2
    300,    // Question 3
    500,    // Question 4
    1000,   // Question 5
    2000,   // Question 6
    4000,   // Question 7
    8000,   // Question 8
    16000,  // Question 9
    32000,  // Question 10
    64000,  // Question 11
    125000, // Question 12
    250000, // Question 13
    500000, // Question 14
    1000000 // Question 15 - Millionaire!
];

// User routes
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email } = req.body;
        
        if (!username || !email) {
            return res.status(400).json({ error: 'Username and email are required' });
        }
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email || u.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            totalEarnings: 0,
            gamesPlayed: 0,
            highestScore: 0,
            achievements: [],
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        await saveUsers();
        
        res.status(201).json({ user: newUser });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Quiz routes
app.get('/api/categories', (req, res) => {
    res.json({ categories: QUIZ_CATEGORIES });
});

app.get('/api/prize-structure', (req, res) => {
    res.json({ prizes: PRIZE_STRUCTURE });
});

// Leaderboard routes
app.get('/api/leaderboard', async (req, res) => {
    try {
        // Sort users by total earnings
        const sortedUsers = users
            .sort((a, b) => b.totalEarnings - a.totalEarnings)
            .slice(0, 50) // Top 50
            .map((user, index) => ({
                rank: index + 1,
                username: user.username,
                totalEarnings: user.totalEarnings,
                gamesPlayed: user.gamesPlayed,
                highestScore: user.highestScore
            }));
        
        res.json({ leaderboard: sortedUsers });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working!',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

// Quiz generation routes
app.post('/api/quiz/generate', async (req, res) => {
    try {
        const { category } = req.body;
        
        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }
        
        console.log(`Generating quiz for category: ${category}`);
        
        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({ 
                error: 'AI service not configured',
                details: 'GEMINI_API_KEY environment variable is missing'
            });
        }
        
        const aiResponse = await geminiService.generateQuestions(category);
        console.log('AI Response received:', JSON.stringify(aiResponse, null, 2));
        
        // Handle the new AI response format
        if (aiResponse && aiResponse.content && aiResponse.content.questions) {
            const questions = aiResponse.content.questions;
            console.log(`Processing ${questions.length} questions from AI response`);
            
            // Transform the AI response to match our expected format
            const transformedQuestions = questions.map((q, index) => ({
                id: `${Date.now()}_${index}`,
                question: q.question,
                options: q.options,
                correctAnswer: q.correct_answer,
                difficulty: q.difficulty_level,
                explanation: q.explanation,
                category: category,
                questionNumber: index + 1,
                prizeValue: PRIZE_STRUCTURE[index],
                // Include lifelines data
                lifelines: {
                    '50-50': q.lifelines.fifty_fifty,
                    audience: q.lifelines.audience_poll,
                    friend: q.lifelines.phone_a_friend
                }
            }));
            
            console.log('Successfully transformed questions');
            
            res.json({ 
                questions: transformedQuestions,
                category,
                totalQuestions: 15,
                prizeStructure: PRIZE_STRUCTURE
            });
        } else {
            console.error('Invalid AI response format:', aiResponse);
            throw new Error('Invalid AI response format');
        }
    } catch (error) {
        console.error('Error generating quiz:', error);
        console.error('Error stack:', error.stack);
        
        // Fallback: Generate a basic quiz for testing
        console.log('Falling back to basic quiz generation...');
        try {
            const fallbackQuestions = generateFallbackQuestions(category);
            // Transform fallback to frontend's expected schema
            const transformedFallback = fallbackQuestions.map((q, index) => ({
                id: `${Date.now()}_${index}`,
                question: q.question,
                options: q.options,
                correctAnswer: q.correct_answer,
                difficulty: q.difficulty_level,
                explanation: q.explanation,
                category: category,
                questionNumber: index + 1,
                prizeValue: PRIZE_STRUCTURE[index],
                lifelines: {
                    '50-50': q.lifelines.fifty_fifty,
                    audience: q.lifelines.audience_poll,
                    friend: q.lifelines.phone_a_friend
                }
            }));
            res.json({ 
                questions: transformedFallback,
                category,
                totalQuestions: 15,
                prizeStructure: PRIZE_STRUCTURE
            });
        } catch (fallbackError) {
            console.error('Fallback quiz generation also failed:', fallbackError);
            res.status(500).json({ 
                error: 'Failed to generate quiz',
                details: 'Both AI service and fallback failed: ' + error.message
            });
        }
    }
});

// Game completion route
app.post('/api/games/complete', async (req, res) => {
    try {
        const { userId, category, questionsAnswered, earnings, isWinner } = req.body;
        
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user stats
        user.totalEarnings += earnings;
        user.gamesPlayed += 1;
        user.highestScore = Math.max(user.highestScore, earnings);
        
        // Add achievements
        if (isWinner && !user.achievements.includes('Millionaire')) {
            user.achievements.push('Millionaire');
        }
        if (user.gamesPlayed === 1 && !user.achievements.includes('First Game')) {
            user.achievements.push('First Game');
        }
        if (user.gamesPlayed === 10 && !user.achievements.includes('Veteran Player')) {
            user.achievements.push('Veteran Player');
        }
        
        // Save game record
        const gameRecord = {
            id: Date.now().toString(),
            userId,
            category,
            questionsAnswered,
            earnings,
            isWinner,
            completedAt: new Date().toISOString()
        };
        
        quizzes.push(gameRecord);
        
        await saveUsers();
        await saveQuizzes();
        
        res.json({ 
            user, 
            gameRecord,
            newAchievements: user.achievements.slice(-1) // Return last achievement if any
        });
    } catch (error) {
        console.error('Error completing game:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    await initializeData();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
}

startServer().catch(console.error);
