// const newrelic = require('newrelic');
const express = require('express');
const dotenv = require('dotenv');
const db = require('../Database/dbIndex.js');
const unique = require('uuid/v4');
const axios = require('axios');
const bodyparser = require('body-parser');
const kue = require('kue');
const redisClient = require('../Database/redis.js');

dotenv.config();
process.setMaxListeners(Infinity);
const app = express();
const queue = kue.createQueue();

const PORT = process.env.PORT || 8080;

app.use(bodyparser.json());

// for client polling
app.post('/polling', async (req, res) => {
  queue
    .create('polling', req.body)
    .priority('critical')
    .attempts(3)
    .save((err) => {
      if (!err) console.log(this.id);
    });

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

  // db.getRideInfo(req.body.rideId).then((ride) => {
  //   if (ride !== undefined) {
  //     if (ride.wait_est !== null) {
  //       res.json({ wait_est: ride.wait_est });
  //     } else {
  //       res.send('No driver matches yet.');
  //     }
  //   } else {
  //     res.send('No driver matches yet.');
  //   }
  // });
});

// initial bookings from client
app.post('/bookings', async (req, res) => {
  // const riderInfo = req.body; // rider_id, start_loc, end_loc
  // const startLoc = `POINT(${riderInfo.start_loc})`;

  req.body.ride_id = unique();
  req.body.timestamp = Math.round(Date.now() / 1000);
  // create job and save it in kue
  queue
    .create('booking', req.body)
    .priority('critical')
    .attempts(3)
    .save((err) => {
      if (!err) {
        res.end();
      } else {
        console.log(err);
        res.end();
      }
    });
  // db.saveUnmatchedRideInfo(req.body);

  // const inventoryRideInfo = {
  //   start_loc: startLoc,
  //   ride_id: rideId,
  // };
  // await axios.post('http://localhost:8080/new_ride', inventoryRideInfo).catch((err) => {
  // });
  // res.send(rideId);
});

app.post('/new_ride', (req, res) => {
  res.end();
});

// getting updated ride_id's from Dispatch service
app.post('/updated', async (req, res) => {
  // contains ride_id, driver_id, wait_est
  queue
    .create('updated', req.body)
    .priority('critical')
    .attempts(3)
    .save((err) => {
      if (!err) {
        res.end();
      } else {
        console.log(err);
        res.end();
      }
    });

  // db.updateUnmatchedRideInfo(req.body.ride_id, req.body);
});

// client sends either cancelled or completed status
app.post('/cancelled', async (req, res) => {
  // Cancelled Status should be determined by client
  // const cancelledStatus = Math.floor(Math.random() * (2 - 0));

  queue
    .create('cancelled', req.body)
    .priority('critical')
    .attempts(3)
    .save((err) => {
      if (!err) {
        console.log(this.id);
        res.end();
      } else {
        console.log(err);
        res.end();
      }
    });

  // this service calculated cancellation time
  // let cancellationTime;
  // if (req.body.cancelled) {
  //   if (req.body.wait_est > 5) {
  //     cancellationTime = Math.floor(Math.random() * (3 - 1) + 1);
  //   } else {
  //     cancellationTime = Math.floor(Math.random() * (req.body.wait_est - 1) + 1);
  //   }
  // } else {
  //   cancellationTime = null;
  // }

  // // retrieve ride_id from db
  // const ride = await db.getRideInfo(req.body.ride_id, cancellationTime, req.body.cancelled);

  // ride.cancellationTime = cancellationTime;
  // ride.cancelledStatus = req.body.cancelled;

  // axios.post('http://localhost:8080/message_bus', ride);
});

app.post('/message_bus', (req, res) => {
  res.end();
});

app.get('/', (req, res) => {
  queue
    .create('initial', '')
    .attempts(3)
    .save((err) => {
      if (!err) {
        res.status(200).end();
      } else {
        console.log(err);
        res.status(200).end();
      }
    });
});

// checks queue continuously
queue.process('initial', (job, done) => {
  done();
});

queue.process('booking', (job, done) => {
  db.saveUnmatchedRideInfo(job);
  done();
});

queue.process('updated', (job, done) => {
  db.updateUnmatchedRideInfo(job.ride_id, job);
  done();
});

queue.process('cancelled', async (job, done) => {
  // this service calculated cancellation time
  let cancellationTime;
  if (job.cancelled) {
    if (job.wait_est > 5) {
      cancellationTime = Math.floor(Math.random() * (3 - 1) + 1);
    } else {
      cancellationTime = Math.floor(Math.random() * (job.wait_est - 1) + 1);
    }
  } else {
    cancellationTime = null;
  }
  // retrieve ride_id from db
  const ride = await db.getRideInfo(job.ride_id, cancellationTime, job.cancelled);

  ride.cancellationTime = cancellationTime;
  ride.cancelledStatus = job.cancelled;

  // axios.post('http://localhost:8080/message_bus', ride);
  done();
});

// watches for stuck jobs in queue in case of server crash
queue.watchStuckJobs(1000);

// const queueProcesses = {
//   initial: () => {
//     queue.process('initial', (job, done) => {
//       console.log('success!');
//       done();
//     });
//   },
//   booking: () => {
//     queue.process('booking', (job, done) => {
//       db.saveUnmatchedRideInfo(job);
//       done();
//     });
//   },
//   updated: () => {
//     queue.process('updated', (job, done) => {
//       db.updateUnmatchedRideInfo(job.ride_id, job);
//       done();
//     });
//   },
//   cancelled: () => {
//     queue.process('cancelled', async (job, done) => {
//       // this service calculated cancellation time
//       let cancellationTime;
//       if (job.cancelled) {
//         if (job.wait_est > 5) {
//           cancellationTime = Math.floor(Math.random() * (3 - 1) + 1);
//         } else {
//           cancellationTime = Math.floor(Math.random() * (job.wait_est - 1) + 1);
//         }
//       } else {
//         cancellationTime = null;
//       }
//       // retrieve ride_id from db
//       const ride = await db.getRideInfo(job.ride_id, cancellationTime, job.cancelled);

//       ride.cancellationTime = cancellationTime;
//       ride.cancelledStatus = job.cancelled;

//       // axios.post('http://localhost:8080/message_bus', ride);
//       done();
//     });
//   },
// };

// const checkQueue = () => {
//   queueProcesses.initial();
//   queueProcesses.booking();
//   queueProcesses.updated();
//   queueProcesses.cancelled();
// };

if (!module.parent) {
  app.listen(PORT, () => {
    console.log('Listening on port ', PORT);
  });
}

// Redis connections
redisClient.on('ready', () => {
  console.log('Redis is ready');
});

redisClient.on('error', () => {
  console.log('Error in Redis');
});

redisClient.set('language', 'nodejs');

module.exports = app;
