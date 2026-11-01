const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

const uri = 'mongodb://andylam852:W570r6583A55fdbefTtzZngHidW3b9jwqWx2IJpniymiAF42yqgePjtjnuGeIWeX4SaBWUxO82rxACDb1Arbcg%3D%3D@andylam852.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@andylam852@';
const client = new MongoClient(uri);

/* GET books page. */
router.get('/', async (req, res, next) => {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    // Pagination logic
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 6; // Number of books per page
    const skip = (page - 1) * limit;

    // Fetch books for the current page
    const books = await libraryCollection
      .find()
      .skip(skip)
      .limit(limit)
      .project({ coverImage: 1, title: 1, description: 1, updatedAt: 1 })
      .toArray();

    // Count total books for pagination
    const totalBooks = await libraryCollection.countDocuments();
    const totalPages = Math.ceil(totalBooks / limit);

    res.render('books', {
      title: 'Books',
      books,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    console.error("Failed to fetch books:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});


// Mock data for books
const mockBooks = [
  {
    id: 1,
    title: 'Book One',
    description: 'Description for Book One',
    coverImage: 'https://via.placeholder.com/150',
  },
  {
    id: 2,
    title: 'Book Two',
    description: 'Description for Book Two',
    coverImage: 'https://via.placeholder.com/150',
  },
  {
    id: 3,
    title: 'Book Three',
    description: 'Description for Book Three',
    coverImage: 'https://via.placeholder.com/150',
  },
  {
    id: 4,
    title: 'Book Four',
    description: 'Description for Book Four',
    coverImage: 'https://via.placeholder.com/150',
  },
  {
    id: 5,
    title: 'Book Five',
    description: 'Description for Book Five',
    coverImage: 'https://via.placeholder.com/150',
  },
  {
    id: 6,
    title: 'Book Six',
    description: 'Description for Book Six',
    coverImage: 'https://via.placeholder.com/150',
  },
];

// Route to get all books (mock data)
// Mock route kept only for API now moved to booksApi.js

module.exports = router;