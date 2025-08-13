const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const GeminiService = require('./geminiService');
const mongoService = require('./mongoService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb'); // Added ObjectId import

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini service
const geminiService = new GeminiService();

// Middleware
app.use(cors()); // Enables CORS for all origins
app.use(express.json());

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'quiz-app-jwt-secret-key-2024-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Helper function to hash password
const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Helper function to compare password
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user._id.toString(), 
            username: user.username,
            email: user.email 
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
    );
};

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
        
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            console.log('Missing username, email, or password');
            return res.status(400).json({ error: 'Username, email, and password are required' });
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
            username,
            email,
            password: await hashPassword(password), // Hash password
            totalEarnings: 0,
            gamesPlayed: 0,
            highestScore: 0,
            achievements: [],
            stats: {
                normal: { gamesPlayed: 0, totalScore: 0, highestScore: 0, questionsAnswered: 0, lastPlayedAt: null, lastCategory: null },
                rapidfire: { gamesPlayed: 0, totalScore: 0, highestScore: 0, questionsAnswered: 0, lastPlayedAt: null, lastCategory: null },
                nooptions: { gamesPlayed: 0, totalScore: 0, highestScore: 0, questionsAnswered: 0, lastPlayedAt: null, lastCategory: null },
                imagebased: { gamesPlayed: 0, totalScore: 0, highestScore: 0, questionsAnswered: 0, lastPlayedAt: null, lastCategory: null },
            },
            gameHistory: [], // Initialize game history
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
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
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
        
        // Compare passwords
        if (!(await comparePassword(password, user.password))) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = generateToken(user);
        res.json({ user, token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user by ID (protected route)
app.get('/api/users/:id', authenticateToken, async (req, res) => {
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
        
        const userId = req.params.id;
        const user = await usersCollection.findOne({ _id: userId });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token endpoint
app.post('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: req.user 
    });
});

// Get current user profile (protected route)
app.get('/api/users/profile/me', authenticateToken, async (req, res) => {
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
        
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Error fetching user profile:', error);
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
        
        // Get limit from query parameter, default to 50
        const limit = parseInt(req.query.limit) || 50;
        
        // Get total count of players
        const totalPlayers = await usersCollection.countDocuments({});
        
        // Sort users by total earnings and limit results
        const sortedUsers = await usersCollection
            .find({})
            .sort({ totalEarnings: -1 })
            .limit(limit)
            .map((user, index) => ({
                rank: index + 1,
                username: user.username,
                totalEarnings: user.totalEarnings,
                gamesPlayed: user.gamesPlayed,
                highestScore: user.highestScore
            }))
            .toArray();
        
        res.json({ 
            leaderboard: sortedUsers,
            totalPlayers: totalPlayers
        });
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
app.post('/api/quizzes/start', async (req, res) => {
	try {
		const { category, mode } = req.body
		
		if (!category || !mode) {
			return res.status(400).json({ error: 'Category and mode are required' })
		}

		console.log(`Starting quiz for category: ${category}, mode: ${mode}`)

		// Generate questions based on mode
		let questions = []
		
		switch (mode) {
			case 'normal':
				questions = await generateNormalQuestions(category)
				break
			case 'rapidfire':
				questions = await generateRapidFireQuestions(category)
				break
			case 'nooptions':
				questions = await generateNoOptionsQuestions(category)
				break
			case 'imagebased':
				questions = generateImageBasedQuestions(category) // Keep as dummy for now
				break
			default:
				return res.status(400).json({ error: 'Invalid game mode' })
		}

		res.json({ 
			questions,
			mode,
			category,
			totalQuestions: questions.length
		})
	} catch (error) {
		console.error('Error starting quiz:', error)
		res.status(500).json({ error: 'Failed to start quiz' })
	}
})

// Generate normal mode questions using AI
async function generateNormalQuestions(category) {
	try {
		console.log(`Generating AI questions for Normal Mode - Category: ${category}`)
        
        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
			console.error('GEMINI_API_KEY not found, using fallback questions')
			return generateFallbackQuestions(category)
		}

		const aiResponse = await geminiService.generateNewQuestions(category)
		console.log('AI Response received for Normal Mode')
		
        if (aiResponse && aiResponse.content && aiResponse.content.questions) {
			const questions = aiResponse.content.questions
			console.log(`Processing ${questions.length} AI questions for Normal Mode`)
            
			// Transform AI response to match frontend format
            const transformedQuestions = questions.map((q, index) => ({
				id: `normal_${Date.now()}_${index}`,
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
			}))
			
			console.log('Successfully transformed AI questions for Normal Mode')
			return transformedQuestions
		} else {
			throw new Error('Invalid AI response format')
		}
	} catch (error) {
		console.error('Error generating Normal Mode questions:', error)
		console.log('Falling back to static questions for Normal Mode')
		return generateFallbackQuestions(category)
	}
}

// Generate rapid fire questions from database (unlimited pool)
async function generateRapidFireQuestions(category) {
	try {
		console.log(`Fetching unlimited questions for Rapid Fire Mode - Category: ${category}`);

		// Get all available questions from database for unlimited rapid fire
		const allQuestions = await geminiService.getQuestionsFromDB(category);

		if (allQuestions && allQuestions.length > 0) {
			console.log(`Using ${allQuestions.length} database questions for Rapid Fire Mode`);

			// Transform all questions for rapid fire (unlimited pool)
			const transformedQuestions = allQuestions.map((q, index) => ({
				id: `rapidfire_${Date.now()}_${index}`,
				question: q.question,
				options: q.options,
				correctAnswer: q.correct_answer,
				difficulty: q.difficulty_level,
				explanation: q.explanation,
				category: category,
				questionNumber: index + 1,
				// No prize value for rapid fire - uses scoring system instead
				// No lifelines for rapid fire mode
			}));

			console.log('Successfully transformed database questions for Rapid Fire Mode');
			return transformedQuestions;
		} else {
			// Fallback to AI generation if no database questions
			console.log('No database questions found, generating new ones for Rapid Fire Mode');
			const aiResponse = await geminiService.generateQuestions(category);

			if (aiResponse && aiResponse.content && aiResponse.content.questions) {
				const questions = aiResponse.content.questions;
				console.log(`Processing ${questions.length} AI questions for Rapid Fire Mode`);

				const transformedQuestions = questions.map((q, index) => ({
					id: `rapidfire_${Date.now()}_${index}`,
					question: q.question,
					options: q.options,
					correctAnswer: q.correct_answer,
					difficulty: q.difficulty_level,
					explanation: q.explanation,
					category: category,
					questionNumber: index + 1,
				}));

				console.log('Successfully transformed AI questions for Rapid Fire Mode');
				return transformedQuestions;
			} else {
				throw new Error('Invalid AI response format');
			}
		}
	} catch (error) {
		console.error('Error generating Rapid Fire questions:', error);
		console.log('Falling back to static questions for Rapid Fire Mode');
		return generateFallbackQuestions(category);
	}
}

// Generate no-options questions using AI
async function generateNoOptionsQuestions(category) {
	try {
		console.log(`Generating AI questions for No Options Mode - Category: ${category}`)
		
		// Check if Gemini API key is available
		if (!process.env.GEMINI_API_KEY) {
			console.error('GEMINI_API_KEY not found, using fallback questions')
			return generateFallbackQuestionsNoOptions(category)
		}

		// Create a special prompt for no-options questions
		const prompt = `
			Generate 15 "Who Wants to Be a Millionaire" style questions for the category: "${category}".
			These questions are for a "No Options" mode where users must type their answers.
			
			The response MUST be a single valid JSON object with this structure:
			{
			  "content": {
				"questions": [
				  {
					"question": "Question text that can be answered with a short text response",
					"correct_answer": "The exact correct answer",
					"difficulty_level": "easy|medium|hard|very hard",
					"explanation": "Brief explanation of the answer"
				  }
				]
			  }
			}

			Requirements:
			1. Questions should have clear, unambiguous answers
			2. Answers should be short (1-3 words typically)
			3. Progressive difficulty: questions 1-4 easy, 5-8 medium, 9-12 hard, 13-15 very hard
			4. Focus on factual knowledge that has definitive answers
			5. Avoid questions that could have multiple correct interpretations
		`

		const result = await geminiService.model.generateContent(prompt)
		const response = await result.response
		let text = response.text().trim()

		// Clean the response
		if (text.startsWith('```json')) {
			text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
		} else if (text.startsWith('```')) {
			text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')
		}

		const parsedJson = JSON.parse(text)
		
		if (parsedJson && parsedJson.content && parsedJson.content.questions) {
			const questions = parsedJson.content.questions
			console.log(`Processing ${questions.length} AI questions for No Options Mode`)
			
			// Transform AI response to match frontend format
			const transformedQuestions = questions.map((q, index) => ({
				id: `nooptions_${Date.now()}_${index}`,
				question: q.question,
				options: null, // No options for this mode
				correctAnswer: q.correct_answer,
				difficulty: q.difficulty_level,
				explanation: q.explanation,
				category: category,
				questionNumber: index + 1,
				prizeValue: PRIZE_STRUCTURE[index]
			}))
			
			console.log('Successfully transformed AI questions for No Options Mode')
			return transformedQuestions
        } else {
			throw new Error('Invalid AI response format')
        }
    } catch (error) {
		console.error('Error generating No Options questions:', error)
		console.log('Falling back to static questions for No Options Mode')
		return generateFallbackQuestionsNoOptions(category)
	}
}

// Fallback for no-options mode
function generateFallbackQuestionsNoOptions(category) {
	const questions = []
	
	const sampleQuestions = [
		{ question: "What is the capital of France?", answer: "Paris", difficulty: "easy" },
		{ question: "What is 2 + 2?", answer: "4", difficulty: "easy" },
		{ question: "What planet is known as the Red Planet?", answer: "Mars", difficulty: "easy" },
		{ question: "Who wrote Romeo and Juliet?", answer: "Shakespeare", difficulty: "medium" },
		{ question: "What is the chemical symbol for gold?", answer: "Au", difficulty: "hard" }
	]
	
	for (let i = 0; i < 15; i++) {
		const sample = sampleQuestions[i % sampleQuestions.length]
		const difficulty = i < 4 ? 'easy' : i < 8 ? 'medium' : i < 12 ? 'hard' : 'very hard'
		
		questions.push({
			id: `fallback_no_${i + 1}`,
			question: `${sample.question} (${category} - Question ${i + 1})`,
			options: null,
			correctAnswer: sample.answer,
			category,
			difficulty,
			explanation: `This is a ${difficulty} question about ${category}`,
			questionNumber: i + 1,
			prizeValue: PRIZE_STRUCTURE[i]
		})
	}
	
	return questions
}

// Generate image-based questions
function generateImageBasedQuestions(category) {
	const questions = []
	
	for (let i = 0; i < 15; i++) {
		questions.push({
			id: `img${i + 1}`,
			question: `Look at the image and answer question ${i + 1} in ${category}?`,
			options: {
				A: `Image option A`,
				B: `Image option B`,
				C: `Image option C`,
				D: `Image option D`
			},
			correctAnswer: 'A',
			category,
			difficulty: 'medium',
			explanation: `Image-based question about ${category}`,
			imageUrl: `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Question+${i + 1}`,
			questionNumber: i + 1,
			prizeValue: [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000][i]
		})
	}
	
	return questions
}

// Game completion route
app.post('/api/games/complete', authenticateToken, async (req, res) => {
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
        
        const { finalScore, questionsAnswered, gameMode, rapidFireScore, category } = req.body;
        const userId = req.user.userId;
        
        if (typeof questionsAnswered !== 'number') {
            return res.status(400).json({ error: 'Invalid questions answered data' });
        }
        
        let scoreToAdd = finalScore || 0;
        
        // Handle rapid fire scoring differently
        if (gameMode === 'rapidfire' && typeof rapidFireScore === 'number') {
            scoreToAdd = rapidFireScore; // Use rapid fire score instead of prize-based score
        }
        
        const modeKey = gameMode || 'normal';
        const nowIso = new Date().toISOString();

        // Create a record for the user's game history
        const gameRecord = {
            gameId: new ObjectId(),
            gameMode: modeKey,
            category: category,
            score: scoreToAdd,
            questionsAnswered: questionsAnswered,
            playedAt: nowIso
        };

        // Build dynamic update for per-mode stats
        const incFields = {
            totalEarnings: scoreToAdd,
            gamesPlayed: 1,
        };
        incFields[`stats.${modeKey}.gamesPlayed`] = 1;
        incFields[`stats.${modeKey}.totalScore`] = scoreToAdd;
        incFields[`stats.${modeKey}.questionsAnswered`] = questionsAnswered;

        const maxFields = {
            highestScore: scoreToAdd,
        };
        maxFields[`stats.${modeKey}.highestScore`] = scoreToAdd;

        const setFields = {
            lastPlayedAt: nowIso,
        };
        setFields[`stats.${modeKey}.lastPlayedAt`] = nowIso;
        if (category) {
            setFields[`stats.${modeKey}.lastCategory`] = category;
        }
        
        // Update user stats
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { 
                $inc: incFields,
                $max: maxFields,
                $set: setFields,
                $push: { gameHistory: { $each: [gameRecord], $slice: -50 } } // Keep last 50 games
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Game completed successfully',
            finalScore: scoreToAdd,
            questionsAnswered,
            gameMode,
            category
        });
    } catch (error) {
        console.error('Error completing game:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Pre-generate question pool for better variety
app.post('/api/questions/generate-pool', async (req, res) => {
    try {
        const { category, count = 50 } = req.body;
        
        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }
        
        console.log(`Starting question pool generation for category: ${category}`);
        const questions = await geminiService.generateQuestionPool(category, count);
        
        res.json({ 
            success: true, 
            message: `Generated ${questions.length} questions for ${category}`,
            category,
            questionsGenerated: questions.length
        });
    } catch (error) {
        console.error('Error generating question pool:', error);
        res.status(500).json({ error: 'Failed to generate question pool' });
    }
});

// Get question statistics
app.get('/api/questions/stats', async (req, res) => {
    try {
        if (!mongoService.isConnected) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const questionsCollection = mongoService.getCollection('questions');
        const stats = await questionsCollection.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    difficulties: { $addToSet: '$difficulty_level' },
                    usedCount: { $sum: { $cond: ['$used', 1, 0] } },
                    unusedCount: { $sum: { $cond: ['$used', 0, 1] } }
                }
            }
        ]).toArray();
        
        // Add limit information to each category
        const enhancedStats = stats.map(stat => ({
            ...stat,
            limit: 100,
            remaining: Math.max(0, 100 - stat.count),
            isFull: stat.count >= 100
        }));
        
        res.json({ 
            success: true, 
            stats: enhancedStats,
            summary: {
                totalCategories: enhancedStats.length,
                totalQuestions: enhancedStats.reduce((sum, stat) => sum + stat.count, 0),
                maxQuestionsPossible: enhancedStats.length * 100
            }
        });
    } catch (error) {
        console.error('Error fetching question stats:', error);
        res.status(500).json({ error: 'Failed to fetch question statistics' });
    }
});

// Admin endpoint to clean up old questions and regenerate pools
app.post('/api/admin/refresh-questions', async (req, res) => {
    try {
        const { category, action = 'generate' } = req.body;
        
        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }
        
        if (action === 'cleanup') {
            // Remove questions that have been used multiple times
            const questionsCollection = mongoService.getCollection('questions');
            const result = await questionsCollection.deleteMany({
                category: category,
                useCount: { $gte: 3 } // Remove questions used 3+ times
            });
            
            res.json({ 
                success: true, 
                message: `Cleaned up ${result.deletedCount} overused questions for ${category}`,
                deletedCount: result.deletedCount
            });
        } else if (action === 'generate') {
            // Generate new question pool (will automatically maintain 100 questions)
            const questions = await geminiService.generateQuestionPool(category, 100);
            
            res.json({ 
                success: true, 
                message: `Generated ${questions.length} new questions for ${category} (maintaining 100 question limit)`,
                questionsGenerated: questions.length
            });
        }
    } catch (error) {
        console.error('Error refreshing questions:', error);
        res.status(500).json({ error: 'Failed to refresh questions' });
    }
});

// Get detailed question information for admin
app.get('/api/admin/questions/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 50, page = 1 } = req.query;
        
        if (!mongoService.isConnected) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const questionsCollection = mongoService.getCollection('questions');
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const questions = await questionsCollection.find({ category })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();
            
        const total = await questionsCollection.countDocuments({ category });
        
        res.json({ 
            success: true, 
            questions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            limitInfo: {
                current: total,
                max: 100,
                remaining: Math.max(0, 100 - total)
            }
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Force maintain question limit for a category
app.post('/api/admin/maintain-limit/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 100 } = req.body;
        
        if (!mongoService.isConnected) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        await geminiService.maintainQuestionLimit(category, limit);
        
        const questionsCollection = mongoService.getCollection('questions');
        const total = await questionsCollection.countDocuments({ category });
        
        res.json({ 
            success: true, 
            message: `Question limit maintained for ${category}`,
            currentCount: total,
            targetLimit: limit
        });
    } catch (error) {
        console.error('Error maintaining question limit:', error);
        res.status(500).json({ error: 'Failed to maintain question limit' });
    }
});

// Refresh all categories to have exactly 100 questions
app.post('/api/admin/refresh-all-categories', async (req, res) => {
    try {
        if (!mongoService.isConnected) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const questionsCollection = mongoService.getCollection('questions');
        const categories = await questionsCollection.distinct('category');
        
        const results = [];
        for (const category of categories) {
            try {
                const currentCount = await geminiService.getQuestionCount(category);
                if (currentCount < 100) {
                    const questionsToGenerate = 100 - currentCount;
                    console.log(`Generating ${questionsToGenerate} questions for ${category}`);
                    
                    const newQuestions = await geminiService.generateQuestionPool(category, questionsToGenerate);
                    results.push({
                        category,
                        previousCount: currentCount,
                        newCount: await geminiService.getQuestionCount(category),
                        questionsGenerated: newQuestions.length
                    });
                } else {
                    results.push({
                        category,
                        previousCount: currentCount,
                        newCount: currentCount,
                        questionsGenerated: 0,
                        message: 'Already at limit'
                    });
                }
            } catch (error) {
                results.push({
                    category,
                    error: error.message
                });
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Refreshed all categories',
            results
        });
    } catch (error) {
        console.error('Error refreshing all categories:', error);
        res.status(500).json({ error: 'Failed to refresh all categories' });
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
