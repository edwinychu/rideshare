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

// for client polling
app.post('/polling', (req, res) => {
  db.getRideInfo(req.body.rideId).then((ride) => {
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
});

// initial bookings from client
app.post('/bookings', async (req, res) => {
  // deployed version
  // const riderInfo = req.body; // rider_id, start_loc, end_loc

  // const startLoc = `POINT(${riderInfo.start_loc})`;

  // generate timestamp with unix date at that moment
  // riderInfo.ride_id = unique();
  // riderInfo.timestamp = Math.round(Date.now() / 1000);

  req.body.ride_id = unique();
  req.body.timestamp = Math.round(Date.now() / 1000);
  db.saveUnmatchedRideInfo(req.body);
  // const inventoryRideInfo = {
  //   start_loc: startLoc,
  //   ride_id: rideId,
  // };
  // await axios.post('http://localhost:8080/new_ride', inventoryRideInfo).catch((err) => {

  // });
  res.end();
  // res.send(rideId);
});

app.post('/new_ride', (req, res) => {
  res.end();
});

// getting updated ride_id's from Dispatch service
app.post('/updated', async (req, res) => {
  // deployed version
  // contains ride_id, driver_id, wait_est
  // update unmatched ride_id in database and store unmatched ride_id in cache
  db.updateUnmatchedRideInfo(req.body.ride_id, req.body);
  res.end();
});

// client sends either cancelled or completed status
app.post('/cancelled', (req, res) => {
  // Cancelled Status should be determined by client
  // const cancelledStatus = Math.floor(Math.random() * (2 - 0));
  // this service calculated cancellation time
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

  

  // retrieve ride_id from db
  let results = db.getRideInfo(req.body.ride_id, cancellationTime, req.body.cancelled);

  getShitFromDb()
  // .then((ride) => {
  //   const updatedRideInfo = ride;
  //   // attach cancellation Time and cancelled status onto data
  //   ride.cancellationTime = cancellationTime;
  //   ride.cancelledStatus = cancelledStatus;
  //   // only in deployed version
  //   axios.post('http://localhost:8080/message_bus', updatedRideInfo);
  // });
  res.end();
});

async function getShitFromDb(ride_id, cancellationTime, cancelled) {
  let results = await db.getRideInfo(ride_id, cancellationTime, cancelled);

} 

app.post('/message_bus', (req, res) => {
  res.end();
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello World!' });
});

if (!module.parent) {
  app.listen(PORT, () => {
    console.log('Listening on port ', PORT);
  });
}

module.exports = app;
