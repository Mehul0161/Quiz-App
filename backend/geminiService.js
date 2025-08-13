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
                console.log('Gemini Service Initialized with MongoDB connection');
            } catch (error) {
                console.warn('MongoDB connection failed, continuing without database:', error.message);
            }
            this.initialized = true;
        }
    }

    async generateQuestions(category) {
        if (!this.initialized) {
            await this.initialize();
        }

        // Try to get varied questions from database first
        const existingQuestions = await this.getQuestionsFromDB(category);
        if (existingQuestions && existingQuestions.length >= 50) {
            console.log(`Using varied questions from database for category: ${category}`);
            return this.selectRandomQuestions(existingQuestions, category);
        }

        // Generate new questions if not enough in database
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
            Generate a complete "Who Wants to Be a Millionaire" game with 15 UNIQUE and DIVERSE questions for the category: "${category}".
            Focus on ${randomVariation} within this category to ensure maximum variety and avoid repetitive questions.
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
        return {
            "content": {
                "game_settings": {
                    "total_questions": 15,
                    "language": "en",
                    "category": category,
                    "difficulty": "progressive",
                    "prize_currency": "USD"
                },
                "questions": [
                    {
                        "question_number": "1",
                        "prize_amount": "100",
                        "question": "What is the capital of France?",
                        "options": { "A": "Berlin", "B": "Madrid", "C": "Paris", "D": "Rome" },
                        "correct_answer": "C",
                        "difficulty_level": "easy",
                        "explanation": "Paris is the capital and most populous city of France.",
                        "lifelines": {
                            "fifty_fifty": ["A", "D"],
                            "audience_poll": { "A": "5%", "B": "10%", "C": "80%", "D": "5%" },
                            "phone_a_friend": "I'm almost certain it's Paris."
                        }
                    },
                    { "question_number": "2", "prize_amount": "200", "question": "Placeholder Question 2", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "easy", "explanation": "Explanation 2", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "3", "prize_amount": "300", "question": "Placeholder Question 3", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "easy", "explanation": "Explanation 3", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "4", "prize_amount": "500", "question": "Placeholder Question 4", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "easy", "explanation": "Explanation 4", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "5", "prize_amount": "1000", "question": "Placeholder Question 5", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "medium", "explanation": "Explanation 5", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "6", "prize_amount": "2000", "question": "Placeholder Question 6", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "medium", "explanation": "Explanation 6", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "7", "prize_amount": "4000", "question": "Placeholder Question 7", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "medium", "explanation": "Explanation 7", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "8", "prize_amount": "8000", "question": "Placeholder Question 8", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "hard", "explanation": "Explanation 8", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "9", "prize_amount": "16000", "question": "Placeholder Question 9", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "hard", "explanation": "Explanation 9", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "10", "prize_amount": "32000", "question": "Placeholder Question 10", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "hard", "explanation": "Explanation 10", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "11", "prize_amount": "64000", "question": "Placeholder Question 11", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "hard", "explanation": "Explanation 11", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "12", "prize_amount": "125000", "question": "Placeholder Question 12", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "very hard", "explanation": "Explanation 12", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "13", "prize_amount": "250000", "question": "Placeholder Question 13", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "very hard", "explanation": "Explanation 13", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "14", "prize_amount": "500000", "question": "Placeholder Question 14", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "very hard", "explanation": "Explanation 14", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } },
                    { "question_number": "15", "prize_amount": "1000000", "question": "Placeholder Question 15", "options": { "A": "A", "B": "B", "C": "C", "D": "D" }, "correct_answer": "A", "difficulty_level": "very hard", "explanation": "Explanation 15", "lifelines": { "fifty_fifty": ["B","C"], "audience_poll": {"A":"70%","B":"10%","C":"10%","D":"10%"}, "phone_a_friend": "Friend advice 2" } }
                ]
            }
        };
    }

    // Database methods for question storage and retrieval
    async saveQuestionsToDatabase(questions, category) {
        try {
            if (!mongoService.isConnected) {
                console.log('MongoDB not connected, skipping question save');
                return;
            }

            const questionsCollection = mongoService.getCollection('questions');
            const questionsToSave = questions.map(q => ({
                ...q,
                category: category,
                createdAt: new Date(),
                used: false
            }));

            await questionsCollection.insertMany(questionsToSave);
            console.log(`Saved ${questions.length} questions for category: ${category}`);
        } catch (error) {
            console.error('Error saving questions to database:', error.message);
        }
    }

    async getQuestionsFromDB(category) {
        try {
            if (!mongoService.isConnected) {
                return null;
            }

            const questionsCollection = mongoService.getCollection('questions');
            const questions = await questionsCollection.find({ 
                category: category 
            }).toArray();

            return questions;
        } catch (error) {
            console.error('Error fetching questions from database:', error.message);
            return null;
        }
    }

    selectRandomQuestions(questionPool, category) {
        // Organize questions by difficulty
        const easy = questionPool.filter(q => q.difficulty_level === 'easy');
        const medium = questionPool.filter(q => q.difficulty_level === 'medium');
        const hard = questionPool.filter(q => q.difficulty_level === 'hard');
        const veryHard = questionPool.filter(q => q.difficulty_level === 'very hard');

        // Select random questions maintaining the difficulty progression
        const selectedQuestions = [];
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
    async generateQuestionPool(category, count = 50) {
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
        
        return questionSets;
    }
}

module.exports = GeminiService;
