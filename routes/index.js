const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = 'mongodb://andylam852:W570r6583A55fdbefTtzZngHidW3b9jwqWx2IJpniymiAF42yqgePjtjnuGeIWeX4SaBWUxO82rxACDb1Arbcg%3D%3D@andylam852.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@andylam852@';
const client = new MongoClient(uri);

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    // Fetch last 6 entries with usable fields for New section
    const newBooks = await libraryCollection
      .find()
      .sort({ _id: -1 })
      .limit(6)
      .project({ coverImage: 1, title: 1, description: 1 })
      .toArray();

    // Fetch first 6 entries with usable fields for Hot section
    const hotBooks = await libraryCollection
      .find()
      .sort({ _id: 1 })
      .limit(6)
      .project({ coverImage: 1, title: 1, description: 1 })
      .toArray();

    // Fetch first 6 entries with usable fields for Trending section
    const trendingBooks = await libraryCollection
      .find()
      .sort({ _id: 1 })
      .limit(6)
      .project({ coverImage: 1, title: 1, description: 1 })
      .toArray();

    res.render('index', {
      title: 'Library Homepage',
      newBooks,
      hotBooks,
      trendingBooks
    });
  } catch (err) {
    console.error("Failed to fetch books:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
  }
});

module.exports = router;