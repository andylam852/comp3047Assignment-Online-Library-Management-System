const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/dbClient');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// use shared db client

const router = express.Router();

// Admin-only for all endpoints
router.use(auth);
router.use(isAdmin);

// GET /api/users - list with pagination, filters, sorting
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const role = (req.query.role || '').trim();
  const keyword = (req.query.keyword || '').trim();
  const sortBy = (req.query.sortBy || 'createdAt').trim();
  const sortOrder = (req.query.sortOrder || 'desc').trim();

  const filter = {};
  if (role === 'user' || role === 'admin') {
    filter.role = role;
  }
  if (keyword) {
    filter.$or = [
      { email: { $regex: keyword, $options: 'i' } },
      { firstName: { $regex: keyword, $options: 'i' } },
      { lastName: { $regex: keyword, $options: 'i' } }
    ];
  }

  const sort = {};
  const order = sortOrder === 'asc' ? 1 : -1;
  const allowedSort = new Set(['email', 'firstName', 'lastName', 'role', 'createdAt']);
  sort[allowedSort.has(sortBy) ? sortBy : 'createdAt'] = order;

  try {
    const db = await getDb();
    const usersCol = db.collection('users');

    const cursor = usersCol.find(filter).project({ password: 0 }).sort(sort).skip(skip).limit(limit);
    const data = await cursor.toArray();
    const total = await usersCol.countDocuments(filter);
    res.status(200).json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// GET /api/users/:id - user details sans password
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid user id' });
  try {
    const db = await getDb();
    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// PUT /api/users/:id - update user
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid user id' });
  const allowed = ['email', 'firstName', 'lastName', 'role'];
  const updateFields = {};
  for (const key of allowed) {
    if (key in req.body) updateFields[key] = req.body[key];
  }
  if (Object.keys(updateFields).length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  try {
    const db = await getDb();
    const usersCol = db.collection('users');
    const result = await usersCol.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { ...updateFields, updatedAt: new Date() } }, { returnDocument: 'after', projection: { password: 0 } });
    if (!result.value) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(result.value);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// DELETE /api/users/:id - delete user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid user id' });
  try {
    const db = await getDb();
    const usersCol = db.collection('users');
    const result = await usersCol.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

module.exports = router;
