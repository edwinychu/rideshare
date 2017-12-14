const express = require('express');
const dotenv = require('dotenv');
const db = require('../Database/dbIndex.js');
const generateFakeData = require('../fakeData.js');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

// creates new tables in Cassandra and then generates/inserts fake data into it
db.createTables().then(() => {
  generateFakeData();
});

// initial bookings from client
app.post('/bookings', (req, res) => {});

// updated ride_id's from Dispatch service
app.post('/updated', (req, res) => {});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello World!' });
});

if (!module.parent) {
  app.listen(PORT, () => {
    console.log('Listening on port ', PORT);
  });
}

module.exports = app;
