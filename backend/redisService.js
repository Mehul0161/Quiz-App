const Redis = require('ioredis');

class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            // Get Redis connection details from environment
            let redisUrl = process.env.REDIS_URL;
            const redisHost = process.env.REDIS_HOST;
            const redisPort = process.env.REDIS_PORT || 6379;
            const redisPassword = process.env.REDIS_PASSWORD;
            const redisUsername = process.env.REDIS_USERNAME || 'default';
            
            // Build connection URL if not provided directly
            if (!redisUrl) {
                if (redisHost) {
                    // Format: redis://username:password@host:port
                    if (redisPassword) {
                        redisUrl = `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`;
                    } else {
                        redisUrl = `redis://${redisHost}:${redisPort}`;
                    }
                } else {
                    redisUrl = 'redis://localhost:6379';
                }
            } else {
                // If REDIS_URL is provided but missing protocol, add it
                if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
                    // If password is provided separately, inject it into the URL
                    if (redisPassword && !redisUrl.includes('@')) {
                        // Format: host:port -> redis://username:password@host:port
                        redisUrl = `redis://${redisUsername}:${redisPassword}@${redisUrl}`;
                    } else {
                        redisUrl = `redis://${redisUrl}`;
                    }
                } else if (redisPassword && !redisUrl.includes('@')) {
                    // URL has protocol but no password, add it
                    const urlParts = redisUrl.replace(/^redis:\/\//, '').split(':');
                    if (urlParts.length === 2) {
                        redisUrl = `redis://${redisUsername}:${redisPassword}@${urlParts[0]}:${urlParts[1]}`;
                    }
                }
            }
            
            // Log connection (mask password for security)
            const logUrl = redisUrl.replace(/:([^:@]+)@/, ':****@');
            console.log(`Connecting to Redis: ${logUrl}`);
            
            this.client = new Redis(redisUrl, {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
                // Additional options for Redis Cloud
                connectTimeout: 10000,
                keepAlive: 30000
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis Client Connecting...');
            });

            this.client.on('ready', () => {
                console.log('Redis Client Ready');
                this.isConnected = true;
            });

            await this.client.connect();
            return true;
        } catch (error) {
            console.warn('Redis connection failed, continuing without cache:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    // Cache question metadata
    async cacheQuestionMetadata(category, mode, metadata) {
        if (!this.isConnected || !this.client) return;
        try {
            const key = `questions:meta:${category}:${mode}`;
            await this.client.setex(key, 3600, JSON.stringify(metadata)); // 1 hour TTL
        } catch (error) {
            console.error('Error caching question metadata:', error);
        }
    }

    async getQuestionMetadata(category, mode) {
        if (!this.isConnected || !this.client) return null;
        try {
            const key = `questions:meta:${category}:${mode}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting question metadata:', error);
            return null;
        }
    }

    // Cache question IDs by difficulty
    async cacheQuestionIds(category, mode, difficulty, questionIds) {
        if (!this.isConnected || !this.client) return;
        try {
            const key = `questions:ids:${category}:${mode}:${difficulty}`;
            await this.client.setex(key, 1800, JSON.stringify(questionIds)); // 30 minutes TTL
        } catch (error) {
            console.error('Error caching question IDs:', error);
        }
    }

    async getQuestionIds(category, mode, difficulty) {
        if (!this.isConnected || !this.client) return null;
        try {
            const key = `questions:ids:${category}:${mode}:${difficulty}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting question IDs:', error);
            return null;
        }
    }

    // Cache full question objects
    async cacheQuestion(questionId, question) {
        if (!this.isConnected || !this.client) return;
        try {
            const key = `question:${questionId}`;
            await this.client.setex(key, 86400, JSON.stringify(question)); // 24 hours TTL
        } catch (error) {
            console.error('Error caching question:', error);
        }
    }

    async getQuestion(questionId) {
        if (!this.isConnected || !this.client) return null;
        try {
            const key = `question:${questionId}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting question:', error);
            return null;
        }
    }

    // Cache multiple questions at once
    async cacheQuestions(questions) {
        if (!this.isConnected || !this.client || !questions || questions.length === 0) return;
        try {
            const pipeline = this.client.pipeline();
            questions.forEach(q => {
                if (q._id) {
                    const key = `question:${q._id.toString()}`;
                    pipeline.setex(key, 86400, JSON.stringify(q));
                }
            });
            await pipeline.exec();
        } catch (error) {
            console.error('Error caching questions:', error);
        }
    }

    // Invalidate cache for a category/mode
    async invalidateCategoryCache(category, mode) {
        if (!this.isConnected || !this.client) return;
        try {
            const pattern = `questions:*:${category}:${mode}*`;
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                console.log(`Invalidated ${keys.length} cache keys for ${category}:${mode}`);
            }
        } catch (error) {
            console.error('Error invalidating cache:', error);
        }
    }

    // Mark questions as used (for tracking)
    async markQuestionsAsUsed(questionIds) {
        if (!this.isConnected || !this.client) return;
        try {
            const key = 'questions:used';
            const now = Date.now();
            questionIds.forEach(id => {
                this.client.zadd(key, now, id);
            });
            // Keep only last 10000 used questions
            await this.client.zremrangebyrank(key, 0, -10001);
        } catch (error) {
            console.error('Error marking questions as used:', error);
        }
    }

    // Health check
    async healthCheck() {
        if (!this.isConnected || !this.client) return false;
        try {
            await this.client.ping();
            return true;
        } catch (error) {
            this.isConnected = false;
            return false;
        }
    }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;

