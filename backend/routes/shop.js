const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const mongoService = require('../mongoService');
const { authenticateToken } = require('../middleware/auth');

// Get all shop items
router.get('/items', async (req, res) => {
  try {
    const { category, rarity, limit, offset } = req.query;
    
    await mongoService.connect();
    const shopCollection = mongoService.getCollection('shop_items');
    
    let query = {};
    if (category) query.category = category;
    if (rarity) query.rarity = rarity;
    
    const items = await shopCollection
      .find(query)
      .sort({ price: 1 })
      .skip(parseInt(offset) || 0)
      .limit(parseInt(limit) || 20)
      .toArray();
    
    const total = await shopCollection.countDocuments(query);
    
    res.json({
      items,
      total,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });
  } catch (error) {
    console.error('Error fetching shop items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shop categories
router.get('/categories', async (req, res) => {
  try {
    await mongoService.connect();
    const shopCollection = mongoService.getCollection('shop_items');
    
    const categories = await shopCollection.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    res.json({
      categories: categories.map(c => ({ name: c._id, count: c.count }))
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Purchase item
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    const shopCollection = mongoService.getCollection('shop_items');
    const transactionsCollection = mongoService.getCollection('transactions');
    
    const userId = new ObjectId(req.user.userId);
    const itemObjectId = new ObjectId(itemId);
    
    // Get item
    const item = await shopCollection.findOne({ _id: itemObjectId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Get user
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has enough earnings
    if (user.totalEarnings < item.price) {
      return res.status(400).json({
        error: 'Insufficient earnings',
        needed: item.price,
        available: user.totalEarnings
      });
    }
    
    // Check if user already owns item
    const alreadyOwned = user.inventory && user.inventory.some(i => i.itemId === itemId);
    if (alreadyOwned) {
      return res.status(400).json({ error: 'You already own this item' });
    }
    
    // Deduct earnings and add item to inventory
    await usersCollection.updateOne(
      { _id: userId },
      {
        $inc: {
          totalEarnings: -item.price,
          spentEarnings: item.price
        },
        $push: {
          inventory: {
            itemId: itemObjectId.toString(),
            name: item.name,
            category: item.category,
            image: item.image,
            rarity: item.rarity,
            acquiredAt: new Date(),
            equipped: false
          }
        }
      }
    );
    
    // Record transaction
    await transactionsCollection.insertOne({
      userId,
      type: 'debit',
      amount: item.price,
      reason: 'shop_purchase',
      itemId: itemObjectId,
      balance: user.totalEarnings - item.price,
      createdAt: new Date()
    });
    
    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: userId });
    
    res.json({
      success: true,
      message: 'Item purchased successfully',
      item: {
        _id: item._id,
        name: item.name,
        price: item.price,
        category: item.category
      },
      wallet: {
        totalEarnings: updatedUser.totalEarnings,
        earningsSpent: item.price
      },
      inventory: updatedUser.inventory
    });
  } catch (error) {
    console.error('Error purchasing item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user inventory
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    
    const user = await usersCollection.findOne({
      _id: new ObjectId(req.user.userId)
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      items: user.inventory || [],
      total: (user.inventory || []).length
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Equip item
router.post('/equip', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    const shopCollection = mongoService.getCollection('shop_items');
    
    const userId = new ObjectId(req.user.userId);
    
    // Get item to check category
    const item = await shopCollection.findOne({ _id: new ObjectId(itemId) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Unequip other items in same category
    await usersCollection.updateOne(
      { _id: userId, 'inventory.category': item.category },
      { $set: { 'inventory.$[elem].equipped': false } },
      { arrayFilters: [{ 'elem.category': item.category }] }
    );
    
    // Equip this item
    await usersCollection.updateOne(
      { _id: userId, 'inventory.itemId': itemId },
      { $set: { 'inventory.$.equipped': true } }
    );
    
    const user = await usersCollection.findOne({ _id: userId });
    
    res.json({
      success: true,
      message: 'Item equipped',
      equipped: user.inventory.filter(i => i.equipped)
    });
  } catch (error) {
    console.error('Error equipping item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unequip item
router.post('/unequip', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    
    const userId = new ObjectId(req.user.userId);
    
    // Unequip item
    await usersCollection.updateOne(
      { _id: userId, 'inventory.itemId': itemId },
      { $set: { 'inventory.$.equipped': false } }
    );
    
    res.json({
      success: true,
      message: 'Item unequipped'
    });
  } catch (error) {
    console.error('Error unequipping item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get equipped items
router.get('/equipped', authenticateToken, async (req, res) => {
  try {
    await mongoService.connect();
    const usersCollection = mongoService.getCollection('users');
    
    const user = await usersCollection.findOne({
      _id: new ObjectId(req.user.userId)
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const equipped = {};
    (user.inventory || []).forEach(item => {
      if (item.equipped) {
        equipped[item.category] = item;
      }
    });
    
    res.json({ equipped });
  } catch (error) {
    console.error('Error fetching equipped items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
