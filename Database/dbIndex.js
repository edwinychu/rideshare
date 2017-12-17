const cassandra = require('cassandra-driver');
const Promise = require('bluebird');

const client = new cassandra.Client({ contactPoints: ['127.0.0.1'], keyspace: 'rideshare' });

client.connect();

const saveUnmatchedRideInfo = (riderInfo) => {
  console.log(riderInfo);
  const { ride_id } = riderInfo;
  const { rider_id } = riderInfo;
  const { start_loc } = riderInfo;
  const { end_loc } = riderInfo;
  const { timestamp } = riderInfo;
  const query =
    'INSERT INTO rideshare.newrides (ride_id, timestamp, rider_id, rider_start, rider_end) VALUES (?, ?, ?, ?, ?)';
  const params = [ride_id, timestamp, rider_id, start_loc, end_loc];

  return new Promise((resolve, reject) => {
    client.execute(query, params, { prepare: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const updateUnmatchedRideInfo = (ride_id, updatedRideInfo) => {
  console.log(updatedRideInfo);

  const { waitEst } = updatedRideInfo;
  const { driver_id } = updatedRideInfo;

  // grabs unmatched ride_id from cache
  const newQuery = `SELECT * FROM rideshare.newrides WHERE ride_id = ${rideId}`;

  return new Promise((resolve, reject) => {
    client.execute(newQuery, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  }).then((ride) => {
    // updates the unmatched ride_id with updated Ride Info
    const { ride_id } = ride;
    const { rider_id } = ride;
    const { start_loc } = ride;
    const { end_loc } = ride;
    const { timestamp } = ride;
    // inserts new matched ride into rideshare.matchedrides
    const matchedQuery =
      'INSERT INTO rideshare.matchedrides (ride_id, timestamp, rider_id, rider_start, rider_end, wait_est, driver_id, cancelled, cancellation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [ride_id, timestamp, rider_id, start_loc, end_loc, waitEst, driver_id, 0, 0];

    new Promise((resolve, reject) => {
      client.execute(matchedQuery, params, { prepare: true }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

const getRideInfo = (rideId) => {
  // grabs ride from rideshare.matchedrides cache after user cancels
  const query = `SELECT * FROM rideshare.matchedrides WHERE ride_id = ${rideId}`;
  return new Promise((resolve, reject) => {
    client.execute(query, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const getMatchedRideInfo = (rideId) => {
  const query = `SELECT * FROM rideshare.matched WHERE ride_id = ${rideId}`;
  return new Promise((resolve, reject) => {
    client.execute(query, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports.getMatchedRideInfo = getMatchedRideInfo;
module.exports.saveUnmatchedRideInfo = saveUnmatchedRideInfo;
module.exports.updateUnmatchedRideInfo = updateUnmatchedRideInfo;
module.exports.getRideInfo = getRideInfo;
