// const newrelic = require('newrelic');
const express = require('express');
const dotenv = require('dotenv');
const db = require('../Database/dbIndex.js');
const unique = require('uuid/v4');
const axios = require('axios');
const bodyparser = require('body-parser');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

app.use(bodyparser.json());

app.post('/polling', async (req, res) => {
  const ride = await db.getRideInfo(req.body.rideId);
  if (ride !== undefined) {
    if (ride.wait_est !== null) {
      res.json({ wait_est: ride.wait_est });
    } else {
      res.send('No driver matches yet.');
    }
  } else {
    res.send('No driver matches yet.');
  }
});

app.post('/bookings', (req, res) => {
  const startLoc = `POINT(${req.body.start_loc})`;

  req.body.ride_id = unique();
  req.body.timestamp = Math.round(Date.now() / 1000);

  db.saveUnmatchedRideInfo(req.body);

  const inventoryRideInfo = {
    start_loc: startLoc,
    ride_id: req.body.ride_id,
  };
  // axios.post('http://localhost:8080/new_ride', inventoryRideInfo).catch((err) => {
  // });
  res.send();
  // res.send(rideId);
});

app.post('/new_ride', (req, res) => {
  res.end();
});

app.post('/updated', (req, res) => {
  // contains ride_id, driver_id, wait_est
  db.updateUnmatchedRideInfo(req.body.ride_id, req.body);
  res.end();
});

app.post('/cancelled', async (req, res) => {
  // const cancelledStatus = Math.floor(Math.random() * (2 - 0));

  let cancellationTime;
  if (req.body.cancelled) {
    if (req.body.wait_est > 5) {
      cancellationTime = Math.floor(Math.random() * (3 - 1) + 1);
    } else {
      cancellationTime = Math.floor(Math.random() * (req.body.wait_est - 1) + 1);
    }
  } else {
    cancellationTime = null;
  }

  const ride = await db.getRideInfo(req.body.ride_id);

  ride.cancellationTime = cancellationTime;
  ride.cancelledStatus = req.body.cancelled;

  // axios.post('http://localhost:8080/message_bus', ride);

  res.end();
});

app.get('/', (req, res) => {
  res.status(200).end();
});

if (!module.parent) {
  app.listen(PORT, () => {
    console.log('Listening on port ', PORT);
  });
}

module.exports.app = app;
