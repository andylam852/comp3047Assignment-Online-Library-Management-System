const { getDb, getClient } = require('../lib/dbClient');

async function run() {
  try {
    const db = await getDb();
    const borrows = db.collection('borrows');
    const users = db.collection('users');
    const library = db.collection('library');

    await Promise.all([
      borrows.createIndex({ bookId: 1, userId: 1, returnedAt: 1 }),
      users.createIndex({ email: 1 }, { unique: true }),
      library.createIndex({ createdAt: -1 })
    ]);

    console.log('Indexes created.');
  } catch (e) {
    console.error('Index creation error:', e);
  } finally {
    const client = await getClient();
    await client.close();
  }
}

run();
