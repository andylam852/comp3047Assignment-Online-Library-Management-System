const express = require('express');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/dbClient');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// use shared db client

const router = express.Router();

// Protect all endpoints
router.use(auth);

// GET /api/books - list/search with pagination
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const q = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();

  const filter = {};
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } }
    ];
  }
  if (category) {
    filter.category = category;
  }

  try {
    const db = await getDb();
    const col = db.collection('library');
    const cursor = col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const data = await cursor.toArray();
    const total = await col.countDocuments(filter);
    res.status(200).json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  } finally {
    // shared client: do not close per request
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid book id' });
  }
  try {
    const db = await getDb();
    const col = db.collection('library');
    const book = await col.findOne({ _id: new ObjectId(id) });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// POST /api/books (admin only)
router.post('/', isAdmin, [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('isbn').notEmpty().withMessage('ISBN is required'),
  body('year').optional().isInt({ min: 1000, max: 9999 }).withMessage('Year must be a valid 4-digit number'),
  body('coverImage').optional().isURL().withMessage('Cover Image must be a valid URL')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const db = await getDb();
    const col = db.collection('library');
    const doc = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await col.insertOne(doc);
    const created = await col.findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// PUT /api/books/:id (admin only)
router.put('/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid book id' });
  try {
    const db = await getDb();
    const col = db.collection('library');
    const update = { ...req.body, updatedAt: new Date() };
    const result = await col.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: update }, { returnDocument: 'after' });
    if (!result.value) return res.status(404).json({ error: 'Book not found' });
    res.status(200).json(result.value);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// DELETE /api/books/:id (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid book id' });
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const col = db.collection('library');
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Book not found' });
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});

// POST /api/books/:id/borrow - borrow a book (user/admin)
router.post('/:id/borrow', async (req, res) => {
  const { id } = req.params;
  const { returnDate } = req.body || {};
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid book id' });
  try {
    const db = await getDb();
    const booksCol = db.collection('library');
    const borrowsCol = db.collection('borrows');

    const book = await booksCol.findOne({ _id: new ObjectId(id) });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    // Prevent duplicate active borrow by same user
    const active = await borrowsCol.findOne({ bookId: new ObjectId(id), userId: req.user.sub, returnedAt: null });
    if (active) return res.status(409).json({ error: 'You already have an active borrow for this book' });

    let parsedReturnDate = null;
    if (returnDate) {
      const d = new Date(returnDate);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid returnDate format' });
      parsedReturnDate = d;
    }

    const doc = {
      bookId: new ObjectId(id),
      userId: req.user.sub, // user _id from token
      userEmail: req.user.email,
      borrowedAt: new Date(),
      plannedReturnDate: parsedReturnDate,
      returnedAt: null,
      comments: [],
      status: 'borrowed'
    };
    const result = await borrowsCol.insertOne(doc);
    const created = await borrowsCol.findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    console.error('Borrow error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// POST /api/books/:id/return - return a borrowed book (user/admin)
router.post('/:id/return', async (req, res) => {
  const { id } = req.params;
  const { comments } = req.body || {};
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid book id' });
  try {
    const db = await getDb();
    const borrowsCol = db.collection('borrows');

    // Active borrow for this user and book
    const active = await borrowsCol.findOne({ bookId: new ObjectId(id), userId: req.user.sub, returnedAt: null });
    if (!active) return res.status(404).json({ error: 'No active borrow for this book' });

    const update = {
      $set: { returnedAt: new Date(), status: 'returned' },
      $push: {}
    };
    if (comments) {
      if (!Array.isArray(update.$push)) update.$push = {}; // ensure structure
      update.$push.comments = comments; // push single or array as raw
    }
    // Adapt push syntax: if comments provided, need $push with $each when array
    if (comments) {
      const pushUpdate = Array.isArray(comments) ? { $each: comments } : comments;
      update.$push = { comments: pushUpdate };
    } else {
      delete update.$push; // no push if no comments
    }

    const result = await borrowsCol.findOneAndUpdate({ _id: active._id }, update, { returnDocument: 'after' });
    res.status(200).json(result.value);
  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// GET /api/books/:id/borrow-history - admin only
router.get('/:id/borrow-history', isAdmin, async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid book id' });
  try {
    const db = await getDb();
    const borrowsCol = db.collection('borrows');
    const filter = { bookId: new ObjectId(id) };
    const cursor = borrowsCol.find(filter).sort({ borrowedAt: -1 }).skip(skip).limit(limit);
    const records = await cursor.toArray();
    const total = await borrowsCol.countDocuments(filter);
    res.status(200).json({ data: records, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // shared client: do not close per request
  }
});

// Mock data route (optional)
const mockBooks = [
  { id: 1, title: 'Book One', description: 'Description for Book One', coverImage: 'https://via.placeholder.com/150' },
  { id: 2, title: 'Book Two', description: 'Description for Book Two', coverImage: 'https://via.placeholder.com/150' }
];
router.get('/mock', (req, res) => res.json(mockBooks));

module.exports = router;
