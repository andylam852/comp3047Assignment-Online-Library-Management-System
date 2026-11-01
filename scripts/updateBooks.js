const { MongoClient } = require('mongodb');

const uri = 'mongodb://andylam852:W570r6583A55fdbefTtzZngHidW3b9jwqWx2IJpniymiAF42yqgePjtjnuGeIWeX4SaBWUxO82rxACDb1Arbcg%3D%3D@andylam852.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@andylam852@';
const client = new MongoClient(uri);

async function updateBooks() {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const libraryCollection = db.collection('library');

    // Update all books to include the updatedAt field if missing
    await libraryCollection.updateMany(
      { updatedAt: { $exists: false } },
      { $set: { updatedAt: new Date() } }
    );

    console.log('Books updated successfully');
  } catch (err) {
    console.error('Failed to update books:', err);
  } finally {
    await client.close();
  }
}

updateBooks();