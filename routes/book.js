const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://andylam852:W570r6583A55fdbefTtzZngHidW3b9jwqWx2IJpniymiAF42yqgePjtjnuGeIWeX4SaBWUxO82rxACDb1Arbcg%3D%3D@andylam852.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@andylam852@';
const client = new MongoClient(uri);

/* GET add book page. */
router.get('/add', (req, res) => {
  res.render('addBook', {
    title: 'Add New Book'
  });
});

/* POST add book. */
router.post('/add', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    const newBook = {
      title: req.body.title,
      location: req.body.location,
      description: req.body.description,
      isbn: req.body.isbn,
      author: req.body.author,
      year: req.body.year,
      coverImage: req.body.coverImage,
      publisher: req.body.publisher,
      category: req.body.category,
      highlight: req.body.highlight === 'on'
    };

    await libraryCollection.insertOne(newBook);
    res.redirect('/books');
  } catch (err) {
    console.error("Failed to add book:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

/* GET edit book page. */
router.get('/edit/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    const bookId = req.params.id;
    const book = await libraryCollection.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
      return res.status(404).send('Book not found');
    }

    res.render('editBook', { title: 'Edit Book', book });
  } catch (err) {
    console.error("Failed to fetch book:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

/* POST edit book. */
router.post('/edit/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    const bookId = req.params.id;
    const updatedBook = {
      title: req.body.title,
      location: req.body.location,
      description: req.body.description,
      isbn: req.body.isbn,
      author: req.body.author,
      year: req.body.year,
      coverImage: req.body.coverImage,
      publisher: req.body.publisher,
      category: req.body.category,
      highlight: req.body.highlight === 'on',
      updatedAt: new Date(),
    };

    await libraryCollection.updateOne({ _id: new ObjectId(bookId) }, { $set: updatedBook });
    res.redirect('/books');
  } catch (err) {
    console.error("Failed to update book:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

/* DELETE book. */
router.post('/delete/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    const bookId = req.params.id;
    await libraryCollection.deleteOne({ _id: new ObjectId(bookId) });
    res.redirect('/books');
  } catch (err) {
    console.error("Failed to delete book:", err);
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

    // Mock borrowing details (replace with actual database query if available)
    const borrowingDetails = [
      { name: 'John Doe', role: 'Student' },
      { name: 'Jane Smith', role: 'Staff' }
    ];

    res.render('detailBook', { title: `Book Detail - ${book.title}`, book, borrowingDetails });
  } catch (err) {
    console.error("Failed to fetch book details:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

module.exports = router;