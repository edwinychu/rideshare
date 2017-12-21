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

// for client polling
app.post('/polling', (req, res) => {
  const { rideId } = req.query;
  db.getRideInfo(rideId).then((ride) => {
    if (ride.wait_est !== null) {
      const waitEst = { wait_est: ride.wait_est };
      res.json(waitEst);
    } else {
      res.send('No driver matches yet.');
    }
  });
});

// initial bookings from client
app.post('/bookings', async (req, res) => {
  // deployed version
  const riderInfo = req.body; // rider_id, start_loc, end_loc
  if (typeof riderInfo.rider_id === 'string') {
    riderInfo.rider_id = parseInt(riderInfo.rider_id);
  }
  const rideId = unique();
  const startLoc = `POINT(${riderInfo.start_loc})`;

  // generate timestamp with unix date at that moment
  riderInfo.ride_id = rideId;
  riderInfo.timestamp = Math.round(Date.now() / 1000);
  db.saveUnmatchedRideInfo(riderInfo);
  const inventoryRideInfo = {
    start_loc: startLoc,
    ride_id: rideId,
  };
  // await axios.post('http://localhost:8080/new_ride', inventoryRideInfo).catch((err) => {});
  res.end();
  // res.send(rideId);
});

app.post('/new_ride', (req, res) => {
  res.end();
});

// getting updated ride_id's from Dispatch service
app.post('/updated', async (req, res) => {
  // deployed version
  const updatedRideInfo = req.body; // contains ride_id, driver_id, wait_est
  const { ride_id } = req.body;
  // update unmatched ride_id in database and store unmatched ride_id in cache
  db.updateUnmatchedRideInfo(ride_id, updatedRideInfo);
});

// client sends either cancelled or completed status
app.post('/cancelled', (req, res) => {
  const { cancelledStatus } = req.body;
  const { ride_id } = req.body;

  // Cancelled Status should be determined by client
  // const cancelledStatus = Math.floor(Math.random() * (2 - 0));
  // this service calculated cancellation time
  let cancellationTime;
  if (cancelledStatus) {
    if (waitEst > 5) {
      cancellationTime = Math.floor(Math.random() * (3 - 1) + 1);
    } else {
      cancellationTime = Math.floor(Math.random() * (waitEst - 1) + 1);
    }
  } else {
    cancellationTime = 0;
  }

  // retrieve ride_id from db
  db.getRideInfo(ride_id).then((ride) => {
    const updatedRideInfo = ride;
    // attach cancellation Time and cancelled status onto data
    updatedRideInfo.cancellationTime = cancellationTime;
    updatedRideInfo.cancelledStatus = cancelledStatus;
    // only in deployed version
    axios.post('http://localhost:8080/message_bus', updatedRideInfo);
  });
});

app.post('/message_bus', (req, res) => {
  console.log('finished sending to message bus');
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

module.exports = app;
