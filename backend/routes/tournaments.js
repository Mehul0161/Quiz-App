const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const mongoService = require('../mongoService');
const { authenticateToken } = require('../middleware/auth');

// Create tournament (admin only)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, category, entryFee, maxPlayers, startDate, endDate, description } = req.body;
    
    if (!name || !category || !entryFee || !maxPlayers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await mongoService.connect();
    const tournamentsCollection = mongoService.getCollection('tournaments');
    
    const tournament = {
      name,
      category,
      entryFee: parseInt(entryFee),
      maxPlayers: parseInt(maxPlayers),
      currentPlayers: 0,
      status: 'open',
      prizePool: 0,
      prizeDistribution: {
        first: Math.floor(entryFee * maxPlayers * 0.5),
        second: Math.floor(entryFee * maxPlayers * 0.3),
        third: Math.floor(entryFee * maxPlayers * 0.2)
      },
      description: description || '',
      players: [],
      bracket: {},
      leaderboard: [],
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await tournamentsCollection.insertOne(tournament);
    
    res.status(201).json({
      success: true,
      tournament: {
        _id: result.insertedId,
        ...tournament
      }
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { status, category, limit, offset } = req.query;
    
    await mongoService.connect();
    const tournamentsCollection = mongoService.getCollection('tournaments');
    
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    
    const tournaments = await tournamentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset) || 0)
      .limit(parseInt(limit) || 20)
      .toArray();
    
    const total = await tournamentsCollection.countDocuments(query);
    
    res.json({
      tournaments,
      total,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tournament details
router.get('/:tournamentId', async (req, res) => {
  try {
    await mongoService.connect();
    const tournamentsCollection = mongoService.getCollection('tournaments');
    
    const tournament = await tournamentsCollection.findOne({
      _id: new ObjectId(req.params.tournamentId)
    });
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join tournament
router.post('/:tournamentId/join', authenticateToken, async (req, res) => {
  try {
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    const tournamentsCollection = mongoService.getCollection('tournaments');
    const transactionsCollection = mongoService.getCollection('transactions');
    
    const userId = new ObjectId(req.user.userId);
    const tournamentId = new ObjectId(req.params.tournamentId);
    
    // Get tournament
    const tournament = await tournamentsCollection.findOne({ _id: tournamentId });
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    // Check if tournament is full
    if (tournament.currentPlayers >= tournament.maxPlayers) {
      return res.status(400).json({ error: 'Tournament is full' });
    }
    
    // Check if tournament is open
    if (tournament.status !== 'open') {
      return res.status(400).json({ error: 'Tournament is not open for joining' });
    }
    
    // Get user
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has enough earnings
    if (user.totalEarnings < tournament.entryFee) {
      return res.status(400).json({
        error: 'Insufficient earnings',
        needed: tournament.entryFee,
        available: user.totalEarnings
      });
    }
    
    // Check if user already joined
    if (tournament.players && tournament.players.includes(userId.toString())) {
      return res.status(400).json({ error: 'Already joined this tournament' });
    }
    
    // Deduct entry fee
    await usersCollection.updateOne(
      { _id: userId },
      {
        $inc: {
          totalEarnings: -tournament.entryFee,
          spentEarnings: tournament.entryFee,
          'tournaments.joined': 1
        }
      }
    );
    
    // Record transaction
    await transactionsCollection.insertOne({
      userId,
      type: 'debit',
      amount: tournament.entryFee,
      reason: 'tournament_entry',
      tournamentId,
      balance: user.totalEarnings - tournament.entryFee,
      createdAt: new Date()
    });
    
    // Add player to tournament
    await tournamentsCollection.updateOne(
      { _id: tournamentId },
      {
        $push: { players: userId.toString() },
        $inc: { currentPlayers: 1, prizePool: tournament.entryFee }
      }
    );
    
    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: userId });
    
    res.json({
      success: true,
      message: 'Successfully joined tournament',
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        currentPlayers: tournament.currentPlayers + 1,
        maxPlayers: tournament.maxPlayers
      },
      wallet: {
        totalEarnings: updatedUser.totalEarnings,
        earningsDeducted: tournament.entryFee
      }
    });
  } catch (error) {
    console.error('Error joining tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's tournaments
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    await mongoService.connect();
    const tournamentsCollection = mongoService.getCollection('tournaments');
    
    const userId = req.user.userId;
    
    const tournaments = await tournamentsCollection
      .find({ players: userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ tournaments });
  } catch (error) {
    console.error('Error fetching user tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tournament leaderboard
router.get('/:tournamentId/leaderboard', async (req, res) => {
  try {
    await mongoService.connect();
    const tournamentsCollection = mongoService.getCollection('tournaments');
    
    const tournament = await tournamentsCollection.findOne({
      _id: new ObjectId(req.params.tournamentId)
    });
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    res.json({
      leaderboard: tournament.leaderboard || [],
      prizeDistribution: tournament.prizeDistribution,
      prizePool: tournament.prizePool
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
