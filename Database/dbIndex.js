const cassandra = require('cassandra-driver');
const axios = require('axios');

const client = new cassandra.Client({
  contactPoints: ['ec2-54-215-130-178.us-west-1.compute.amazonaws.com'],
});

const queryUnmatched =
  "CREATE TABLE IF NOT EXISTS rideshare.newrides (ride_id text PRIMARY KEY, timestamp int, rider_id int, rider_start text, rider_end text) WITH caching = { 'keys' : 'ALL','rows_per_partition' : 'ALL'}";

const queryMatched =
  "CREATE TABLE IF NOT EXISTS rideshare.matchedrides (ride_id text PRIMARY KEY, timestamp int, rider_id int, rider_start text, rider_end text, wait_est int, driver_id int, cancelled int, cancellation_time int) WITH caching = { 'keys' : 'ALL','rows_per_partition' : 'ALL'}";

client
  .connect()
  .then(() =>
    client.execute("CREATE KEYSPACE IF NOT EXISTS rideshare WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 3}"))
  .then(() => client.execute('USE rideshare'))
  .then(() => client.execute(queryUnmatched))
  .then(() => client.execute(queryMatched))
  .catch((err) => {
    console.log(err);
  });

function saveUnmatchedRideInfo(riderInfo) {
  const { ride_id } = riderInfo;
  const { rider_id } = riderInfo;
  const { start_loc } = riderInfo;
  const { end_loc } = riderInfo;
  const { timestamp } = riderInfo;
  const query =
    'INSERT INTO rideshare.newrides (ride_id, timestamp, rider_id, rider_start, rider_end) VALUES (?, ?, ?, ?, ?)';
  const params = [ride_id, timestamp, rider_id, start_loc, end_loc];

  client.execute(query, params, { prepare: true }, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

async function updateUnmatchedRideInfo(rideId, updatedRideInfo) {
  // grabs unmatched ride_id from cache
  const newQuery = 'SELECT * FROM rideshare.newrides WHERE ride_id=?';
  const results = await client.execute(newQuery, [rideId], { prepare: true });
  const ride = results.rows[0];
  // inserts new matched ride into rideshare.matchedrides
  const matchedQuery =
    'INSERT INTO rideshare.matchedrides (ride_id, timestamp, rider_id, rider_start, rider_end, wait_est, driver_id, cancelled, cancellation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const params = [
    rideId,
    ride.timestamp,
    ride.rider_id,
    ride.rider_start,
    ride.rider_end,
    updatedRideInfo.wait_est,
    updatedRideInfo.driver_id,
    0,
    0,
  ];
  client.execute(matchedQuery, params, { prepare: true }, (err) => {
    if (err) console.log(err);
  });
}

async function getRideInfo(rideId) {
  // grabs ride from rideshare.matchedrides cache after user cancels
  const query = 'SELECT * FROM rideshare.matchedrides WHERE ride_id=?';
  const results = await client.execute(query, [rideId], { prepare: true });
  const ride = results.rows[0];
  return ride;
}

module.exports.saveUnmatchedRideInfo = saveUnmatchedRideInfo;
module.exports.updateUnmatchedRideInfo = updateUnmatchedRideInfo;
module.exports.getRideInfo = getRideInfo;
