// const newrelic = require('newrelic');
const express = require('express');
const dotenv = require('dotenv');
const db = require('../Database/dbIndex.js');
const unique = require('uuid/v4');
const axios = require('axios');
const bodyparser = require('body-parser');
const AWS = require('aws-sdk');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 80;

const sqs = new AWS.SQS({
  region: 'us-west-1',
  maxRetries: 15,
  apiVersion: '2012-11-05',
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }),
});

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
  req.body.start_loc = `POINT(${req.body.start_loc})`;
  req.body.end_loc = `POINT(${req.body.end_loc})`;
  req.body.ride_id = unique();
  req.body.timestamp = Math.round(Date.now() / 1000);

  db.saveUnmatchedRideInfo(req.body);
  const inventoryRideInfo = {
    start_loc: req.body.start_loc,
    ride_id: req.body.ride_id,
  };
  // axios.post('http://ec2-18-218-96-30.us-east-2.compute.amazonaws.com/', inventoryRideInfo).catch((err) => {
  // });
  res.send();
  // res.send({rideId : req.body.ride_id});
});

app.post('/new_ride', (req, res) => {
  res.end();
});

app.post('/updated', (req, res) => {
  db.updateUnmatchedRideInfo(req.body.ride_id, req.body);
  res.end();
});

app.post('/cancelled', async (req, res) => {
  // const cancelledStatus = Math.floor(Math.random() * (2 - 0));
  const ride = await db.getRideInfo(req.body.ride_id);

  let cancellationTime;
  let driverLoc;
  if (req.body.cancelled) {
    driverLoc = ride.rider_start;
    if (req.body.wait_est > 5) {
      cancellationTime = Math.floor(Math.random() * (3 - 1) + 1);
    } else {
      cancellationTime = Math.floor(Math.random() * (req.body.wait_est - 1) + 1);
    }
  } else {
    driverLoc = ride.rider_end;
    cancellationTime = null;
  }

  ride.cancellationTime = cancellationTime;
  ride.cancelledStatus = req.body.cancelled;

  const driver = {
    driver_id: ride.driver_id,
    driver_loc: `POINT(${driverLoc})`,
  };

  const inventoryParam = {
    MessageBody: `${JSON.stringify(driver)}`,
    QueueUrl: process.env.QUEUE_URL_INVENTORY,
    DelaySeconds: 0,
  };

  const analyticsParam = {
    MessageBody: `${JSON.stringify(ride)}`,
    QueueUrl: process.env.QUEUE_URL_ANALYTICS,
    DelaySeconds: 0,
  };

  sqs.sendMessage(inventoryParam, (err, data) => {
    if (err) {
      console.log('failed');
    }
  });

  sqs.sendMessage(analyticsParam, (err, data) => {
    if (err) {
      console.log('failed');
    }
  });

  res.end();
});

app.get('/', (req, res) => {
  res.status(200).end('Hello World!');
});

if (!module.parent) {
  app.listen(PORT, () => {
    console.log('Listening on port ', PORT);
  });
}

module.exports.app = app;
