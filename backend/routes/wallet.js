const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const mongoService = require('../mongoService');
const { authenticateToken } = require('../middleware/auth');

// Get user wallet/earnings
router.get('/', authenticateToken, async (req, res) => {
  try {
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      totalEarnings: user.totalEarnings || 0,
      earnedEarnings: user.earnedEarnings || user.totalEarnings || 0,
      spentEarnings: user.spentEarnings || 0,
      availableEarnings: user.totalEarnings || 0
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    await mongoService.connect();
    const transactionsCollection = mongoService.getCollection('transactions');
    
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const transactions = await transactionsCollection
      .find({ userId: new ObjectId(req.user.userId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    const total = await transactionsCollection.countDocuments({ 
      userId: new ObjectId(req.user.userId) 
    });
    
    res.json({
      transactions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add earnings (internal - called by game completion)
router.post('/add-earnings', authenticateToken, async (req, res) => {
  try {
    const { amount, reason, gameId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    const transactionsCollection = mongoService.getCollection('transactions');
    
    const userId = new ObjectId(req.user.userId);
    
    // Add earnings
    const result = await usersCollection.updateOne(
      { _id: userId },
      {
        $inc: {
          totalEarnings: amount,
          earnedEarnings: amount
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Record transaction
    await transactionsCollection.insertOne({
      userId,
      type: 'credit',
      amount,
      reason: reason || 'game_completion',
      gameId: gameId ? new ObjectId(gameId) : null,
      balance: (await usersCollection.findOne({ _id: userId })).totalEarnings,
      createdAt: new Date()
    });
    
    const updatedUser = await usersCollection.findOne({ _id: userId });
    
    res.json({
      success: true,
      newBalance: updatedUser.totalEarnings,
      amountAdded: amount
    });
  } catch (error) {
    console.error('Error adding earnings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deduct earnings (internal - called by tournament/shop)
router.post('/deduct-earnings', authenticateToken, async (req, res) => {
  try {
    const { amount, reason, tournamentId, itemId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    const transactionsCollection = mongoService.getCollection('transactions');
    
    const userId = new ObjectId(req.user.userId);
    
    // Check balance
    const user = await usersCollection.findOne({ _id: userId });
    if (!user || user.totalEarnings < amount) {
      return res.status(400).json({ 
        error: 'Insufficient earnings',
        available: user?.totalEarnings || 0,
        needed: amount
      });
    }
    
    // Deduct earnings
    const result = await usersCollection.updateOne(
      { _id: userId },
      {
        $inc: {
          totalEarnings: -amount,
          spentEarnings: amount
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Record transaction
    await transactionsCollection.insertOne({
      userId,
      type: 'debit',
      amount,
      reason: reason || 'transaction',
      tournamentId: tournamentId ? new ObjectId(tournamentId) : null,
      itemId: itemId ? new ObjectId(itemId) : null,
      balance: user.totalEarnings - amount,
      createdAt: new Date()
    });
    
    const updatedUser = await usersCollection.findOne({ _id: userId });
    
    res.json({
      success: true,
      newBalance: updatedUser.totalEarnings,
      amountDeducted: amount
    });
  } catch (error) {
    console.error('Error deducting earnings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
