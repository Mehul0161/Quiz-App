const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const GeminiService = require('./geminiService');
const mongoService = require('./mongoService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini service
const geminiService = new GeminiService();

// Middleware
app.use(cors()); // Enables CORS for all origins
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

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
                correctAnswer: "C",
                difficulty: "easy",
                explanation: "Paris is the capital and most populous city of France.",
                lifelines: {
                    '50-50': ["A", "D"],
                    audience: { "A": "5%", "B": "10%", "C": "80%", "D": "5%" },
                    friend: "I'm almost certain it's Paris."
                }
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: { A: "Venus", B: "Mars", C: "Jupiter", D: "Saturn" },
                correctAnswer: "B",
                difficulty: "easy",
                explanation: "Mars is called the Red Planet due to its reddish appearance.",
                lifelines: {
                    '50-50': ["A", "C"],
                    audience: { "A": "10%", "B": "75%", "C": "10%", "D": "5%" },
                    friend: "I think it's Mars, the red one."
                }
            },
            {
                question: "What is the largest ocean on Earth?",
                options: { A: "Atlantic", B: "Indian", C: "Arctic", D: "Pacific" },
                correctAnswer: "D",
                difficulty: "easy",
                explanation: "The Pacific Ocean is the largest and deepest ocean on Earth.",
                lifelines: {
                    '50-50': ["A", "C"],
                    audience: { "A": "15%", "B": "10%", "C": "5%", "D": "70%" },
                    friend: "Pacific is the biggest ocean, I'm sure."
                }
            }
        ],
        'History': [
            {
                question: "Who was the first President of the United States?",
                options: { A: "George Washington", B: "Thomas Jefferson", C: "Abraham Lincoln", D: "John Adams" },
                correctAnswer: "A",
                difficulty: "easy",
                explanation: "George Washington was the first President of the United States.",
                lifelines: {
                    '50-50': ["B", "D"],
                    audience: { "A": "85%", "B": "8%", "C": "5%", "D": "2%" },
                    friend: "Definitely George Washington, the first president."
                }
            },
            {
                question: "In which year did World War II end?",
                options: { A: "1944", B: "1945", C: "1946", D: "1947" },
                correctAnswer: "B",
                difficulty: "easy",
                explanation: "World War II ended in 1945 with the surrender of Germany and Japan.",
                lifelines: {
                    '50-50': ["A", "C"],
                    audience: { "A": "5%", "B": "85%", "C": "8%", "D": "2%" },
                    friend: "I think it was 1945, the war ended then."
                }
            }
        ],
        'Science & Technology': [
            {
                question: "What is the chemical symbol for gold?",
                options: { A: "Go", B: "Gd", C: "Au", D: "Ag" },
                correctAnswer: "C",
                difficulty: "medium",
                explanation: "Au is the chemical symbol for gold, from the Latin 'aurum'.",
                lifelines: {
                    '50-50': ["A", "B"],
                    audience: { "A": "10%", "B": "15%", "C": "70%", "D": "5%" },
                    friend: "Gold is Au, I remember that from chemistry."
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
            questionNumber: (i + 1),
            prizeValue: PRIZE_STRUCTURE[i]
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
        console.log('Registration request received:', { body: req.body });
        
        const { username, email } = req.body;
        
        if (!username || !email) {
            console.log('Missing username or email');
            return res.status(400).json({ error: 'Username and email are required' });
        }
        
        console.log('Attempting to connect to MongoDB...');
        
        // Connect to MongoDB with timeout
        const connectPromise = mongoService.connect();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
        );
        
        try {
            await Promise.race([connectPromise, timeoutPromise]);
        } catch (connectionError) {
            console.error('MongoDB connection failed:', connectionError.message);
            return res.status(500).json({ 
                error: 'Database connection failed',
                details: connectionError.message 
            });
        }
        
        console.log('MongoDB connected, getting users collection...');
        const usersCollection = mongoService.getCollection('users');
        
        console.log('Checking if user already exists...');
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ error: 'User already exists' });
        }
        
        console.log('Creating new user...');
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
        
        console.log('Inserting user into database...');
        await usersCollection.insertOne(newUser);
        
        console.log('User created successfully:', newUser.id);
        res.status(201).json({ user: newUser });
        
    } catch (error) {
        console.error('Error registering user:', error);
        
        // Ensure response is sent
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message 
            });
        }
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Connect to MongoDB
        try {
            await mongoService.connect();
        } catch (connectionError) {
            console.error('MongoDB connection failed:', connectionError.message);
            return res.status(500).json({ 
                error: 'Database connection failed',
                details: connectionError.message 
            });
        }
        const usersCollection = mongoService.getCollection('users');
        
        const user = await usersCollection.findOne({ email });
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
        // Connect to MongoDB
        try {
            await mongoService.connect();
        } catch (connectionError) {
            console.error('MongoDB connection failed:', connectionError.message);
            return res.status(500).json({ 
                error: 'Database connection failed',
                details: connectionError.message 
            });
        }
        const usersCollection = mongoService.getCollection('users');
        
        const user = await usersCollection.findOne({ id: req.params.id });
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
        // Connect to MongoDB
        try {
            await mongoService.connect();
        } catch (connectionError) {
            console.error('MongoDB connection failed:', connectionError.message);
            return res.status(500).json({ 
                error: 'Database connection failed',
                details: connectionError.message 
            });
        }
        const usersCollection = mongoService.getCollection('users');
        
        // Sort users by total earnings
        const sortedUsers = await usersCollection
            .find({})
            .sort({ totalEarnings: -1 })
            .limit(50)
            .map((user, index) => ({
                rank: index + 1,
                username: user.username,
                totalEarnings: user.totalEarnings,
                gamesPlayed: user.gamesPlayed,
                highestScore: user.highestScore
            }))
            .toArray();
        
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
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
        mongodbDbName: process.env.MONGODB_DB_NAME || 'quiz-app'
    });
});

// Simple test endpoint for debugging
app.get('/api/debug', (req, res) => {
    res.json({
        message: 'Debug endpoint working',
        timestamp: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV,
            vercel: !!process.env.VERCEL,
            mongodbUri: process.env.MONGODB_URI ? 'Configured' : 'Missing',
            mongodbDbName: process.env.MONGODB_DB_NAME || 'quiz-app'
        }
    });
});

// Test MongoDB connection directly
app.get('/api/test-mongo', async (req, res) => {
    try {
        console.log('Testing MongoDB connection...');
        console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
        console.log('MONGODB_DB_NAME:', process.env.MONGODB_DB_NAME || 'quiz-app');
        
        try {
            await mongoService.connect();
            const dbName = process.env.MONGODB_DB_NAME || 'quiz-app';
            
            res.json({
                message: 'MongoDB connection successful',
                database: dbName,
                timestamp: new Date().toISOString()
            });
        } catch (connectionError) {
            console.error('MongoDB connection failed:', connectionError.message);
            res.status(500).json({
                error: 'MongoDB connection failed',
                details: connectionError.message,
                mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
                mongodbDbName: process.env.MONGODB_DB_NAME || 'quiz-app'
            });
        }
    } catch (error) {
        console.error('MongoDB test failed:', error);
        res.status(500).json({
            error: 'MongoDB connection failed',
            details: error.message,
            mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
            mongodbDbName: process.env.MONGODB_DB_NAME || 'quiz-app'
        });
    }
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
                correctAnswer: q.correctAnswer || q.correct_answer,
                difficulty: q.difficulty || q.difficulty_level,
                explanation: q.explanation,
                category: category,
                questionNumber: index + 1,
                prizeValue: PRIZE_STRUCTURE[index],
                // Include lifelines data
                lifelines: {
                    '50-50': q.lifelines['50-50'] || q.lifelines.fifty_fifty,
                    audience: q.lifelines.audience || q.lifelines.audience_poll,
                    friend: q.lifelines.friend || q.lifelines.phone_a_friend
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
                correctAnswer: q.correctAnswer,
                difficulty: q.difficulty,
                explanation: q.explanation,
                category: category,
                questionNumber: index + 1,
                prizeValue: PRIZE_STRUCTURE[index],
                lifelines: {
                    '50-50': q.lifelines['50-50'],
                    audience: q.lifelines.audience,
                    friend: q.lifelines.friend
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
        
        // Connect to MongoDB
        try {
            await mongoService.connect();
        } catch (connectionError) {
            console.error('MongoDB connection failed:', connectionError.message);
            return res.status(500).json({ 
                error: 'Database connection failed',
                details: connectionError.message 
            });
        }
        const usersCollection = mongoService.getCollection('users');
        const quizzesCollection = mongoService.getCollection('quizzes');
        
        const user = await usersCollection.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user stats
        const updateResult = await usersCollection.updateOne(
            { id: userId },
            { 
                $inc: { 
                    totalEarnings: earnings,
                    gamesPlayed: 1
                },
                $max: { highestScore: earnings }
            }
        );
        
        // Add achievements
        if (isWinner && !user.achievements.includes('Millionaire')) {
            await usersCollection.updateOne(
                { id: userId },
                { $push: { achievements: 'Millionaire' } }
            );
        }
        if (user.gamesPlayed === 0 && !user.achievements.includes('First Game')) {
            await usersCollection.updateOne(
                { id: userId },
                { $push: { achievements: 'First Game' } }
            );
        }
        if (user.gamesPlayed === 9 && !user.achievements.includes('Veteran Player')) {
            await usersCollection.updateOne(
                { id: userId },
                { $push: { achievements: 'Veteran Player' } }
            );
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
        
        await quizzesCollection.insertOne(gameRecord);
        
        // Get updated user
        const updatedUser = await usersCollection.findOne({ id: userId });
        
        res.json({ 
            user: updatedUser, 
            gameRecord,
            newAchievements: updatedUser.achievements.slice(-1) // Return last achievement if any
        });
    } catch (error) {
        console.error('Error completing game:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const mongoHealthy = await mongoService.healthCheck();
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            mongodb: mongoHealthy ? 'connected' : 'disconnected'
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            mongodb: 'error',
            error: error.message
        });
    }
});

// Start server (disabled on Vercel serverless)
async function startServer() {
    try {
        // Connect to MongoDB
        await mongoService.connect();
        console.log('MongoDB connected successfully');
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        console.error('Server startup failed due to MongoDB connection error');
        process.exit(1);
    }
}

if (!process.env.VERCEL) {
  startServer().catch(console.error);
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;
