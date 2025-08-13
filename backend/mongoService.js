const { MongoClient } = require('mongodb');

class MongoService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return this.db;
    
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      this.client = new MongoClient(uri);
      await this.client.connect();
      
      // Use environment variable for database name, fallback to 'quiz-app'
      const dbName = process.env.MONGODB_DB_NAME || 'quiz-app';
      this.db = this.client.db(dbName);
      this.isConnected = true;
      
      console.log(`Connected to MongoDB Atlas database: ${dbName}`);
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  getCollection(collectionName) {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db.collection(collectionName);
  }

  // Health check
  async healthCheck() {
    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const mongoService = new MongoService();

module.exports = mongoService;
