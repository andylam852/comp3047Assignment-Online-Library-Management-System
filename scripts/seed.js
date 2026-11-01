const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://andylam852:W570r6583A55fdbefTtzZngHidW3b9jwqWx2IJpniymiAF42yqgePjtjnuGeIWeX4SaBWUxO82rxACDb1Arbcg%3D%3D@andylam852.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@andylam852@';
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('libraryDB');
    const users = db.collection('users');

    // Seed regular user
    const userEmail = 'test@example.com';
    const userPassword = 'Password123!';
    const userHash = await bcrypt.hash(userPassword, 10);
    const existingUser = await users.findOne({ email: userEmail });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
    } else {
      await users.insertOne({ email: userEmail, password: userHash, name: 'Test User', role: 'user', createdAt: new Date() });
      console.log('Seeded user:', userEmail, 'password:', userPassword);
    }

    // Seed admin user
    const adminEmail = 'admin@example.com';
    const adminPassword = 'AdminPassword123!';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const existingAdmin = await users.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
    } else {
      await users.insertOne({ email: adminEmail, password: adminHash, name: 'Admin User', role: 'admin', createdAt: new Date() });
      console.log('Seeded admin:', adminEmail, 'password:', adminPassword);
    }
  } catch (e) {
    console.error('Seed error:', e);
  } finally {
    await client.close();
  }
}

run();
