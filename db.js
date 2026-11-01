// npm install mongodb

const { MongoClient } = require('mongodb');

// Replace the environment variable with the actual connection string for testing
const uri = 'mongodb://andylam852:W570r6583A55fdbefTtzZngHidW3b9jwqWx2IJpniymiAF42yqgePjtjnuGeIWeX4SaBWUxO82rxACDb1Arbcg%3D%3D@andylam852.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@andylam852@';

// Create a new MongoClient
const client = new MongoClient(uri);

async function run() {
    try {
        // Connect the client to the server
        await client.connect();
        console.log("Connected successfully to MongoDB");

        // Access the libraryDB database
        const db = client.db('libraryDB');

        // Access the library collection
        const libraryCollection = db.collection('library');

        // Fetch all documents from the library collection
        const books = await libraryCollection.find().toArray();
        console.log("Books in libraryDB:", books);
    } catch (err) {
        console.error("Database operation failed:", err);
    }
}

async function createIndex() {
    try {
        const db = client.db('libraryDB');
        const libraryCollection = db.collection('library');

        // Create an index on the 'addedDate' field
        const result = await libraryCollection.createIndex({ addedDate: -1 });
        console.log(`Index created: ${result}`);
    } catch (err) {
        console.error("Failed to create index:", err);
    }
}

// Ensure the client is closed when the application exits
process.on('SIGINT', async () => {
    console.log("Closing MongoDB client...");
    await client.close();
    console.log("MongoDB client closed.");
    process.exit(0);
});

run().catch(console.dir);
createIndex().catch(console.dir);