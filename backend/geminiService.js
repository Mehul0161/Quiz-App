const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoService = require('./mongoService');

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        this.initialized = false;
        this.questionPool = new Map(); // Cache for questions by category
    }

    async initialize() {
        if (!this.initialized) {
            try {
                await mongoService.connect();
                await this.setupDatabaseIndexes();
                console.log('Gemini Service Initialized with MongoDB connection');
            } catch (error) {
                console.warn('MongoDB connection failed, continuing without database:', error.message);
            }
            this.initialized = true;
        }
    }

    async setupDatabaseIndexes() {
        try {
            if (!mongoService.isConnected) return;
            
            const questionsCollection = mongoService.getCollection('questions');
            
            // Create indexes for better performance
            await questionsCollection.createIndex({ category: 1, difficulty_level: 1 });
            await questionsCollection.createIndex({ category: 1, used: 1, lastUsed: 1 });
            await questionsCollection.createIndex({ category: 1, createdAt: -1 });
            
            console.log('Database indexes created successfully');
        } catch (error) {
            console.error('Error setting up database indexes:', error.message);
        }
    }

    async generateQuestions(category) {
        if (!this.initialized) {
            await this.initialize();
        }

        // Try to get varied questions from database first
        const existingQuestions = await this.getQuestionsFromDB(category);
        if (existingQuestions && existingQuestions.length >= 30) {
            console.log(`Using varied questions from database for category: ${category} (${existingQuestions.length} available)`);
            return this.selectRandomQuestions(existingQuestions, category);
        }

        // Generate new questions if not enough in database
        console.log(`Low question pool for ${category} (${existingQuestions?.length || 0}), generating new questions`);
        return await this.generateNewQuestions(category);
    }

    async generateNewQuestions(category) {
        const prizeStructure = [
            100, 200, 300, 500, 1000,
            2000, 4000, 8000, 16000, 32000,
            64000, 125000, 250000, 500000, 1000000
        ];

        // Generate multiple variations to increase variety
        const variations = [
            'current events and recent developments',
            'historical facts and famous personalities',
            'scientific discoveries and innovations',
            'cultural aspects and traditions',
            'lesser-known facts and trivia'
        ];

        const randomVariation = variations[Math.floor(Math.random() * variations.length)];

        const prompt = `
            Generate a complete "Who Wants to Be a Millionaire" game with 15 UNIQUE, CHALLENGING, and DIVERSE questions for the category: "${category}".
            Focus on ${randomVariation} within this category to ensure maximum variety and avoid repetitive questions.
            
            IMPORTANT REQUIREMENTS:
            1. Questions must be genuinely challenging - avoid basic/common knowledge
            2. Include obscure facts, recent developments, and lesser-known information
            3. Questions should test deep understanding, not just memorization
            4. Use specific dates, names, and technical details where appropriate
            5. Include questions that require analytical thinking and reasoning
            6. Avoid generic questions that appear in basic trivia games
            
            The response MUST be a single valid JSON object. Do not include any text, markdown, or code formatting before or after the JSON object.

            The JSON structure must follow this exact format:
            {
              "content": {
                "game_settings": {
                  "total_questions": 15,
                  "language": "en",
                  "category": "${category}",
                  "difficulty": "progressive",
                  "prize_currency": "USD"
                },
                "questions": [
                  // Array of 15 question objects
                ]
              }
            }

            Each question object in the "questions" array must have the following structure:
            {
              "question_number": "1", // string from "1" to "15"
              "prize_amount": "100", // string, corresponding to the prize structure
              "question": "The question text.",
    "options": {
                "A": "Option A",
                "B": "Option B",
                "C": "Option C",
                "D": "Option D"
              },
              "correct_answer": "A", // "A", "B", "C", or "D"
              "difficulty_level": "easy", // "easy", "medium", "hard", "very hard"
              "explanation": "A brief explanation of the correct answer.",
              "lifelines": {
                "fifty_fifty": ["B", "D"], // Array of two incorrect option keys to remove
                "audience_poll": {
                  "A": "82%", "B": "10%", "C": "5%", "D": "3%" // All four options with simulated percentages. The correct answer should have the highest. Percentages must sum to 100%.
                },
                "phone_a_friend": "A short, confident (but not always 100% certain) text response suggesting an answer." // e.g., "I'm pretty sure it's George Washington."
              }
            }
            
            Key requirements:
            1.  Generate exactly 15 questions.
            2.  The prize amounts for each question must be: ${prizeStructure.join(', ')}.
            3.  Difficulty must be progressive: start with "easy", move to "medium", then "hard", and finally "very hard" for the last few questions.
            4.  For "fifty_fifty", provide two incorrect option keys.
            5.  For "audience_poll", simulate realistic percentages that sum to 100%, with the correct answer being the most popular choice.
            6.  For "phone_a_friend", create a short, natural-sounding phrase.
            7.  Ensure the entire output is a single, clean JSON object without any extra formatting.
        `;

        try {
            console.log('Generating quiz with new format...');
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // Clean the response to ensure it's valid JSON
            if (text.startsWith('```json')) {
                text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (text.startsWith('```')) {
                text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsedJson = JSON.parse(text);
            
            // Basic validation to ensure the structure is correct
            if (!parsedJson.content || !parsedJson.content.questions || parsedJson.content.questions.length !== 15) {
                throw new Error('Generated content does not match the required structure.');
            }

            console.log('Successfully generated and parsed quiz.');
            
            // Save questions to database for future use
            await this.saveQuestionsToDatabase(parsedJson.content.questions, category);
            
            return parsedJson;
            
        } catch (error) {
            console.error('Error generating questions with Gemini:', error.message);
            console.log('Falling back to a local mock quiz.');
            return this.getFallbackQuiz(category); // Provide a fallback
        }
    }

    getFallbackQuiz(category) {
        // This function returns a static, well-formed quiz object for testing or in case of AI failure.
        // Generate category-specific fallback questions instead of generic placeholders
        const categoryQuestions = this.generateCategorySpecificQuestions(category);
        
        return {
            "content": {
                "game_settings": {
                    "total_questions": 15,
                    "language": "en",
                    "category": category,
                    "difficulty": "progressive",
                    "prize_currency": "USD"
                },
                "questions": categoryQuestions
            }
        };
    }

    generateCategorySpecificQuestions(category) {
        const questions = [];
        const prizeStructure = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
        
        // Generate 15 category-specific questions
        for (let i = 0; i < 15; i++) {
            const difficulty = i < 4 ? 'easy' : i < 8 ? 'medium' : i < 12 ? 'hard' : 'very hard';
            const questionData = this.getQuestionForCategory(category, i + 1, difficulty);
            
            questions.push({
                "question_number": (i + 1).toString(),
                "prize_amount": prizeStructure[i].toString(),
                "question": questionData.question,
                "options": questionData.options,
                "correct_answer": questionData.correct_answer,
                "difficulty_level": difficulty,
                "explanation": questionData.explanation,
                "lifelines": {
                    "fifty_fifty": questionData.fifty_fifty,
                    "audience_poll": questionData.audience_poll,
                    "phone_a_friend": questionData.phone_a_friend
                }
            });
        }
        
        return questions;
    }

    getQuestionForCategory(category, questionNumber, difficulty) {
        // Generate category-specific questions based on the selected category
        const categoryLower = category.toLowerCase();
        
        if (categoryLower.includes('science') || categoryLower.includes('technology')) {
            return this.getScienceQuestion(questionNumber, difficulty);
        } else if (categoryLower.includes('history')) {
            return this.getHistoryQuestion(questionNumber, difficulty);
        } else if (categoryLower.includes('geography')) {
            return this.getGeographyQuestion(questionNumber, difficulty);
        } else if (categoryLower.includes('sports')) {
            return this.getSportsQuestion(questionNumber, difficulty);
        } else if (categoryLower.includes('entertainment')) {
            return this.getEntertainmentQuestion(questionNumber, difficulty);
        } else if (categoryLower.includes('literature')) {
            return this.getLiteratureQuestion(questionNumber, difficulty);
        } else if (categoryLower.includes('mathematics')) {
            return this.getMathematicsQuestion(questionNumber, difficulty);
        } else if (categoryLower.includes('art') || categoryLower.includes('culture')) {
            return this.getArtCultureQuestion(questionNumber, difficulty);
        } else if (categoryLower.includes('current') || categoryLower.includes('affairs')) {
            return this.getCurrentAffairsQuestion(questionNumber, difficulty);
        } else {
            // General Knowledge fallback
            return this.getGeneralKnowledgeQuestion(questionNumber, difficulty);
        }
    }

    getScienceQuestion(number, difficulty) {
        const questions = [
            {
                question: "What is the chemical symbol for gold?",
                options: { "A": "Go", "B": "Gd", "C": "Au", "D": "Ag" },
                correct_answer: "C",
                explanation: "Au is the chemical symbol for gold, from the Latin 'aurum'.",
                fifty_fifty: ["A", "B"],
                audience_poll: { "A": "10%", "B": "15%", "C": "70%", "D": "5%" },
                phone_a_friend: "I'm pretty sure it's Au for gold."
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: { "A": "Venus", "B": "Mars", "C": "Jupiter", "D": "Saturn" },
                correct_answer: "B",
                explanation: "Mars is called the Red Planet due to its reddish appearance.",
                fifty_fifty: ["A", "C"],
                audience_poll: { "A": "10%", "B": "75%", "C": "10%", "D": "5%" },
                phone_a_friend: "Definitely Mars, the red one."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getHistoryQuestion(number, difficulty) {
        const questions = [
            {
                question: "Who was the first President of the United States?",
                options: { "A": "George Washington", "B": "Thomas Jefferson", "C": "Abraham Lincoln", "D": "John Adams" },
                correct_answer: "A",
                explanation: "George Washington was the first President of the United States.",
                fifty_fifty: ["B", "D"],
                audience_poll: { "A": "85%", "B": "8%", "C": "5%", "D": "2%" },
                phone_a_friend: "Definitely George Washington, the first president."
            },
            {
                question: "In which year did World War II end?",
                options: { "A": "1944", "B": "1945", "C": "1946", "D": "1947" },
                correct_answer: "B",
                explanation: "World War II ended in 1945 with the surrender of Germany and Japan.",
                fifty_fifty: ["A", "C"],
                audience_poll: { "A": "5%", "B": "85%", "C": "8%", "D": "2%" },
                phone_a_friend: "I think it was 1945, the war ended then."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getGeographyQuestion(number, difficulty) {
        const questions = [
            {
                question: "What is the capital of France?",
                options: { "A": "Berlin", "B": "Madrid", "C": "Paris", "D": "Rome" },
                correct_answer: "C",
                explanation: "Paris is the capital and most populous city of France.",
                fifty_fifty: ["A", "D"],
                audience_poll: { "A": "5%", "B": "10%", "C": "80%", "D": "5%" },
                phone_a_friend: "I'm almost certain it's Paris."
            },
            {
                question: "What is the largest ocean on Earth?",
                options: { "A": "Atlantic", "B": "Indian", "C": "Arctic", "D": "Pacific" },
                correct_answer: "D",
                explanation: "The Pacific Ocean is the largest and deepest ocean on Earth.",
                fifty_fifty: ["A", "C"],
                audience_poll: { "A": "15%", "B": "10%", "C": "5%", "D": "70%" },
                phone_a_friend: "Pacific is the biggest ocean, I'm sure."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getSportsQuestion(number, difficulty) {
        const questions = [
            {
                question: "Which country has won the most FIFA World Cup titles?",
                options: { "A": "Germany", "B": "Argentina", "C": "Brazil", "D": "Italy" },
                correct_answer: "C",
                explanation: "Brazil has won the FIFA World Cup 5 times, more than any other country.",
                fifty_fifty: ["A", "D"],
                audience_poll: { "A": "15%", "B": "20%", "C": "60%", "D": "5%" },
                phone_a_friend: "Brazil has the most World Cup wins, I think."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getEntertainmentQuestion(number, difficulty) {
        const questions = [
            {
                question: "Who directed the movie 'Titanic'?",
                options: { "A": "Steven Spielberg", "B": "James Cameron", "C": "Christopher Nolan", "D": "Quentin Tarantino" },
                correct_answer: "B",
                explanation: "James Cameron directed the 1997 film 'Titanic'.",
                fifty_fifty: ["A", "C"],
                audience_poll: { "A": "20%", "B": "65%", "C": "10%", "D": "5%" },
                phone_a_friend: "I'm pretty sure it's James Cameron."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getLiteratureQuestion(number, difficulty) {
        const questions = [
            {
                question: "Who wrote 'Romeo and Juliet'?",
                options: { "A": "Charles Dickens", "B": "William Shakespeare", "C": "Jane Austen", "D": "Mark Twain" },
                correct_answer: "B",
                explanation: "William Shakespeare wrote the famous tragedy 'Romeo and Juliet'.",
                fifty_fifty: ["A", "C"],
                audience_poll: { "A": "10%", "B": "75%", "C": "10%", "D": "5%" },
                phone_a_friend: "Definitely Shakespeare, that's his most famous play."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getMathematicsQuestion(number, difficulty) {
        const questions = [
            {
                question: "What is 2 + 2?",
                options: { "A": "3", "B": "4", "C": "5", "D": "6" },
                correct_answer: "B",
                explanation: "2 + 2 equals 4.",
                fifty_fifty: ["A", "C"],
                audience_poll: { "A": "5%", "B": "85%", "C": "8%", "D": "2%" },
                phone_a_friend: "That's basic math, it's 4."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getArtCultureQuestion(number, difficulty) {
        const questions = [
            {
                question: "Who painted the Mona Lisa?",
                options: { "A": "Vincent van Gogh", "B": "Pablo Picasso", "C": "Leonardo da Vinci", "D": "Michelangelo" },
                correct_answer: "C",
                explanation: "Leonardo da Vinci painted the Mona Lisa in the early 16th century.",
                fifty_fifty: ["A", "D"],
                audience_poll: { "A": "10%", "B": "15%", "C": "70%", "D": "5%" },
                phone_a_friend: "I'm almost certain it's Leonardo da Vinci."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getCurrentAffairsQuestion(number, difficulty) {
        const questions = [
            {
                question: "What year is it currently?",
                options: { "A": "2022", "B": "2023", "C": "2024", "D": "2025" },
                correct_answer: "C",
                explanation: "The current year is 2024.",
                fifty_fifty: ["B", "D"],
                audience_poll: { "A": "5%", "B": "15%", "C": "75%", "D": "5%" },
                phone_a_friend: "It's 2024, I'm sure of that."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    getGeneralKnowledgeQuestion(number, difficulty) {
        const questions = [
            {
                question: "What is the capital of France?",
                options: { "A": "Berlin", "B": "Madrid", "C": "Paris", "D": "Rome" },
                correct_answer: "C",
                explanation: "Paris is the capital and most populous city of France.",
                fifty_fifty: ["A", "D"],
                audience_poll: { "A": "5%", "B": "10%", "C": "80%", "D": "5%" },
                phone_a_friend: "I'm almost certain it's Paris."
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: { "A": "Venus", "B": "Mars", "C": "Jupiter", "D": "Saturn" },
                correct_answer: "B",
                explanation: "Mars is called the Red Planet due to its reddish appearance.",
                fifty_fifty: ["A", "C"],
                audience_poll: { "A": "10%", "B": "75%", "C": "10%", "D": "5%" },
                phone_a_friend: "Definitely Mars, the red one."
            }
        ];
        
        return questions[number % questions.length] || questions[0];
    }

    // Database methods for question storage and retrieval
    async saveQuestionsToDatabase(questions, category) {
        try {
            if (!mongoService.isConnected) {
                console.log('MongoDB not connected, skipping question save');
                return;
            }

            const questionsCollection = mongoService.getCollection('questions');
            
            // Check for duplicate questions to avoid saving the same content
            const questionTexts = questions.map(q => q.question.toLowerCase().trim());
            const existingQuestions = await questionsCollection.find({
                category: category,
                question: { $in: questionTexts.map(text => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) }
            }).toArray();
            
            if (existingQuestions.length > 0) {
                console.log(`Found ${existingQuestions.length} existing questions, skipping duplicates`);
                // Only save questions that don't already exist
                const newQuestions = questions.filter((q, index) => 
                    !existingQuestions.some(existing => 
                        existing.question.toLowerCase().trim() === questionTexts[index]
                    )
                );
                
                if (newQuestions.length === 0) {
                    console.log('All questions already exist in database');
                    return;
                }
                
                questions = newQuestions;
            }

            const questionsToSave = questions.map(q => ({
                ...q,
                category: category,
                createdAt: new Date(),
                used: false,
                useCount: 0,
                lastUsed: null,
                questionHash: this.generateQuestionHash(q.question, q.options, q.correct_answer)
            }));

            // Save new questions
            const result = await questionsCollection.insertMany(questionsToSave);
            console.log(`Saved ${questions.length} new questions for category: ${category}`);
            
            // Maintain exactly 100 questions per category by removing oldest ones
            await this.maintainQuestionLimit(category, 100);
            
            return result.insertedIds;
        } catch (error) {
            console.error('Error saving questions to database:', error.message);
        }
    }

    async maintainQuestionLimit(category, limit = 100) {
        try {
            if (!mongoService.isConnected) return;
            
            const questionsCollection = mongoService.getCollection('questions');
            
            // Count total questions for this category
            const totalQuestions = await questionsCollection.countDocuments({ category });
            
            if (totalQuestions > limit) {
                // Find questions to delete (oldest ones first)
                const questionsToDelete = await questionsCollection.find({ category })
                    .sort({ createdAt: 1 }) // Oldest first
                    .limit(totalQuestions - limit)
                    .toArray();
                
                if (questionsToDelete.length > 0) {
                    const questionIds = questionsToDelete.map(q => q._id);
                    await questionsCollection.deleteMany({ _id: { $in: questionIds } });
                    
                    console.log(`Deleted ${questionsToDelete.length} old questions from ${category} to maintain limit of ${limit}`);
                }
            }
        } catch (error) {
            console.error('Error maintaining question limit:', error.message);
        }
    }

    generateQuestionHash(question, options, correctAnswer) {
        // Create a hash to identify duplicate questions
        const content = `${question.toLowerCase().trim()}-${Object.values(options).join('-').toLowerCase().trim()}-${correctAnswer}`;
        return require('crypto').createHash('md5').update(content).digest('hex');
    }

        async getQuestionsFromDB(category) {
        try {
            if (!mongoService.isConnected) {
                return null;
            }

            const questionsCollection = mongoService.getCollection('questions');
            
            // Get questions with usage tracking - prefer less used questions
            let questions = await questionsCollection.find({
                category: category
            }).sort({
                used: 1,           // Less used questions first
                lastUsed: 1,       // Then by last used date
                createdAt: -1      // Finally by creation date (newer first)
            }).toArray();

            // If we have less than 30 questions, reset usage flags to reuse questions
            if (questions.length < 30) {
                console.log(`Low question pool for ${category} (${questions.length}), resetting usage flags`);
                await questionsCollection.updateMany(
                    { category: category },
                    { $set: { used: false, lastUsed: null } }
                );
                
                // Fetch questions again after reset
                questions = await questionsCollection.find({
                    category: category
                }).sort({
                    createdAt: -1  // Use newest questions first
                }).toArray();
            }

            return questions;
        } catch (error) {
            console.error('Error fetching questions from database:', error.message);
            return null;
        }
    }

    async getNoOptionsQuestionsFromDB(category) {
        try {
            if (!mongoService.isConnected) {
                return null;
            }

            const questionsCollection = mongoService.getCollection('questions');
            
            // Get questions with usage tracking - prefer less used questions
            let questions = await questionsCollection.find({
                category: category,
                options: null 
            }).sort({
                used: 1,           // Less used questions first
                lastUsed: 1,       // Then by last used date
                createdAt: -1      // Finally by creation date (newer first)
            }).toArray();

            // If we have less than 15 questions, reset usage flags to reuse questions
            if (questions.length < 15) {
                console.log(`Low question pool for ${category} (${questions.length}), resetting usage flags`);
                await questionsCollection.updateMany(
                    { category: category, options: null },
                    { $set: { used: false, lastUsed: null } }
                );
                
                // Fetch questions again after reset
                questions = await questionsCollection.find({
                    category: category,
                    options: null
                }).sort({
                    createdAt: -1  // Use newest questions first
                }).toArray();
            }

            return questions;
        } catch (error) {
            console.error('Error fetching questions from database:', error.message);
            return null;
        }
    }

    async getQuestionCount(category) {
        try {
            if (!mongoService.isConnected) {
                return 0;
            }

            const questionsCollection = mongoService.getCollection('questions');
            return await questionsCollection.countDocuments({ category });
        } catch (error) {
            console.error('Error getting question count:', error.message);
            return 0;
        }
    }

    async markQuestionsAsUsed(questionIds) {
        try {
            if (!mongoService.isConnected) {
                return;
            }

            const questionsCollection = mongoService.getCollection('questions');
            const updatePromises = questionIds.map(id => 
                questionsCollection.updateOne(
                    { _id: id },
                    { 
                        $set: { 
                            used: true, 
                            lastUsed: new Date(),
                            useCount: { $inc: 1 }
                        }
                    }
                )
            );

            await Promise.all(updatePromises);
            console.log(`Marked ${questionIds.length} questions as used`);
        } catch (error) {
            console.error('Error marking questions as used:', error.message);
        }
    }

    selectRandomQuestions(questionPool, category) {
        // Organize questions by difficulty and usage
        const easy = questionPool.filter(q => q.difficulty_level === 'easy');
        const medium = questionPool.filter(q => q.difficulty_level === 'medium');
        const hard = questionPool.filter(q => q.difficulty_level === 'hard');
        const veryHard = questionPool.filter(q => q.difficulty_level === 'very hard');

        // Shuffle arrays to increase randomness
        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        // Select random questions maintaining the difficulty progression
        const selectedQuestions = [];
        const selectedIds = [];
        const prizeStructure = [
            100, 200, 300, 500, 1000,
            2000, 4000, 8000, 16000, 32000,
            64000, 125000, 250000, 500000, 1000000
        ];

        // Questions 1-4: Easy
        for (let i = 0; i < 4; i++) {
            if (easy.length > 0) {
                const randomIndex = Math.floor(Math.random() * easy.length);
                const question = easy.splice(randomIndex, 1)[0];
                selectedQuestions.push({
                    ...question,
                    question_number: (i + 1).toString(),
                    prize_amount: prizeStructure[i].toString()
                });
            }
        }

        // Questions 5-8: Medium
        for (let i = 4; i < 8; i++) {
            if (medium.length > 0) {
                const randomIndex = Math.floor(Math.random() * medium.length);
                const question = medium.splice(randomIndex, 1)[0];
                selectedQuestions.push({
                    ...question,
                    question_number: (i + 1).toString(),
                    prize_amount: prizeStructure[i].toString()
                });
            }
        }

        // Questions 9-12: Hard
        for (let i = 8; i < 12; i++) {
            if (hard.length > 0) {
                const randomIndex = Math.floor(Math.random() * hard.length);
                const question = hard.splice(randomIndex, 1)[0];
                selectedQuestions.push({
                    ...question,
                    question_number: (i + 1).toString(),
                    prize_amount: prizeStructure[i].toString()
                });
            }
        }

        // Questions 13-15: Very Hard
        for (let i = 12; i < 15; i++) {
            if (veryHard.length > 0) {
                const randomIndex = Math.floor(Math.random() * veryHard.length);
                const question = veryHard.splice(randomIndex, 1)[0];
                selectedQuestions.push({
                    ...question,
                    question_number: (i + 1).toString(),
                    prize_amount: prizeStructure[i].toString()
                });
            }
        }

        // Fill remaining slots if needed
        while (selectedQuestions.length < 15) {
            const allRemaining = [...easy, ...medium, ...hard, ...veryHard];
            if (allRemaining.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * allRemaining.length);
            const question = allRemaining[randomIndex];
            selectedQuestions.push({
                ...question,
                question_number: selectedQuestions.length + 1 + "",
                prize_amount: prizeStructure[selectedQuestions.length].toString()
            });
        }

        return {
            content: {
                game_settings: {
                    total_questions: 15,
                    language: "en",
                    category: category,
                    difficulty: "progressive",
                    prize_currency: "USD"
                },
                questions: selectedQuestions
            }
        };
    }

    // Method to generate multiple question sets for better variety
    async generateQuestionPool(category, count = 100) {
        console.log(`Generating ${count} questions for category: ${category}`);
        
        const questionSets = [];
        const setsToGenerate = Math.ceil(count / 15);
        
        for (let i = 0; i < setsToGenerate; i++) {
            try {
                const questionSet = await this.generateNewQuestions(category);
                if (questionSet && questionSet.content && questionSet.content.questions) {
                    questionSets.push(...questionSet.content.questions);
                }
                
                // Add delay to avoid rate limiting
                if (i < setsToGenerate - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.error(`Error generating question set ${i + 1}:`, error.message);
            }
        }
        
        // Ensure we have exactly the requested number of questions
        const finalQuestions = questionSets.slice(0, count);
        console.log(`Generated ${finalQuestions.length} questions for ${category}`);
        
        return finalQuestions;
    }
}

module.exports = GeminiService;
