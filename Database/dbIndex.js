const cassandra = require('cassandra-driver');
const async = require('async');
const Promise = require('bluebird');

const client = new cassandra.Client({ contactPoints: ['127.0.0.1'], keyspace: 'rideshare' });

client.connect();

const createTables = () => {
  const queryUnmatched =
    'CREATE TABLE IF NOT EXISTS rideshare.unmatched (ride_id text PRIMARY KEY, timestamp int, rider_id int, rider_start text, rider_end text)';

  const queryMatched =
    'CREATE TABLE IF NOT EXISTS rideshare.matched (ride_id text PRIMARY KEY, timestamp int, rider_id int, rider_start text, rider_end text, wait_est int, driver_id int, cancelled int, cancellation_time int)';

  return new Promise((resolve, reject) => {
    client.execute(queryUnmatched, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  }).then(() =>
    new Promise((resolve, reject) => {
      client.execute(queryMatched, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }));
};

async function insertIntoUnmatched(unmatchedBatch, matchedBatch) {
  // const query = `INSERT INTO rideshare.unmatched (ride_id, timestamp, rider_id, rider_start, rider_end) VALUES (${
  //   data.ride_id
  // }, ${data.timestamp}, ${data.rider_id}, '${data.rider_start}', '${data.rider_end}')`;

  // return client.execute(query, (err) => {
  //   if (err) {
  //     console.log(err);
  //   }
  // });

  console.log(unmatchedBatch);

  await client.batch(unmatchedBatch, { prepare: true }).then(() => {
    console.log('inside matched');
    client.batch(matchedBatch, { prepare: true });
  });

  // return new Promise((resolve, reject) => {
  //   client.execute(query, (err) => {
  //     if (!err) {
  //       resolve();
  //     }
  //   });
  // });
}

const insertIntoMatched = (batch) => {
  console.log('in matched');
  const query = `INSERT INTO rideshare.matched (ride_id, timestamp, rider_id, rider_start, rider_end, wait_est, driver_id, cancelled, cancellation_time) VALUES (${
    data.ride_id
  }, ${data.timestamp}, ${data.rider_id}, '${data.rider_start}', '${data.rider_end}', ${
    data.wait_est
  }, ${data.driver_id}, ${data.cancelled}, ${data.cancellation_time})`;

  client.batch();

  return new Promise((resolve, reject) => {
    client.execute(query, (err) => {
      if (err) {
        console.log(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports.createTables = createTables;
module.exports.insertIntoUnmatched = insertIntoUnmatched;
module.exports.insertIntoMatched = insertIntoMatched;
