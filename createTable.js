const cassandra = require('cassandra-driver');
const async = require('async');
const Promise = require('bluebird');

const client = new cassandra.Client({ contactPoints: ['127.0.0.1'], keyspace: 'rideshare' });

client.connect();

const createTables = () => {
  const deleteUnmatched = 'DROP TABLE IF EXISTS rideshare.unmatched';

  const deleteMatched = 'DROP TABLE IF EXISTS rideshare.matched';

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

createTables();

module.exports.createTables = createTables;
