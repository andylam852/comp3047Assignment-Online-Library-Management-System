const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://andylam852:W570r6583A55fdbefTtzZngHidW3b9jwqWx2IJpniymiAF42yqgePjtjnuGeIWeX4SaBWUxO82rxACDb1Arbcg%3D%3D@andylam852.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@andylam852@';
const client = new MongoClient(uri);

/* GET search page. */
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    const currentPage = parseInt(req.query.page) || 1;
    const booksPerPage = 4;

    const allBooks = await libraryCollection.find().toArray();
    const totalPages = Math.ceil(allBooks.length / booksPerPage);
    const books = allBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);

    res.render('search', {
      title: 'Search Books',
      books,
      currentPage,
      totalPages,
    });
  } catch (err) {
    console.error("Failed to fetch books:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

/* GET book detail page. */
router.get('/detail/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    const bookId = req.params.id;
    const book = await libraryCollection.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
      return res.status(404).send('Book not found');
    }

    res.render('detailBook', { title: `Book Detail - ${book.title}`, book });
  } catch (err) {
    console.error("Failed to fetch book details:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

/* POST filter books. */
router.post('/filter', async (req, res) => {
  const { keywords, category, location } = req.body;
  const currentPage = parseInt(req.query.page) || 1;
  const booksPerPage = 4;

  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    const query = {};
    if (keywords) {
      query.$or = [
        { title: { $regex: keywords, $options: 'i' } },
        { description: { $regex: keywords, $options: 'i' } },
      ];
    }
    if (category) {
      query.category = category;
    }
    if (location) {
      query.location = location;
    }

    const allResults = await libraryCollection.find(query).toArray();
    const totalPages = Math.ceil(allResults.length / booksPerPage);
    const books = allResults.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);

    res.render('filteredBooks', {
      title: 'Filtered Books',
      books,
      currentPage,
      totalPages,
    });
  } catch (err) {
    console.error("Failed to filter books:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

module.exports = router;