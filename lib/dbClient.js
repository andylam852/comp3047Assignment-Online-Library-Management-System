const { MongoClient } = require('mongodb');

const uri = 'mongodb://andylam852:W570r6583A55fdbefTtzZngHidW3b9jwqWx2IJpniymiAF42yqgePjtjnuGeIWeX4SaBWUxO82rxACDb1Arbcg%3D%3D@andylam852.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@andylam852@';

let client;
let connecting;

async function getClient() {
  if (client && client.topology && client.topology.isConnected()) return client;
  if (!connecting) {
    client = new MongoClient(uri);
    connecting = client.connect();
  }
  await connecting;
  return client;
}

async function getDb() {
  const c = await getClient();
  return c.db('libraryDB');
}

module.exports = { getClient, getDb };
