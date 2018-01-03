const cassandra = require('cassandra-driver');
const Promise = require('bluebird');

const client = new cassandra.Client({ contactPoints: ['localhost'] });

client
  .connect()
  .then(() =>
    client.execute("CREATE KEYSPACE IF NOT EXISTS rideshare WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 3}"))
  .then(() => client.execute('USE rideshare'));

const createTables = () => {
  const queryUnmatched =
    "CREATE TABLE IF NOT EXISTS rideshare.newrides (ride_id text PRIMARY KEY, timestamp int, rider_id int, rider_start text, rider_end text) WITH caching = { 'keys' : 'ALL','rows_per_partition' : 'ALL'}";

  const queryMatched =
    "CREATE TABLE IF NOT EXISTS rideshare.matchedrides (ride_id text PRIMARY KEY, timestamp int, rider_id int, rider_start text, rider_end text, wait_est int, driver_id int, cancelled int, cancellation_time int) WITH caching = { 'keys' : 'ALL','rows_per_partition' : 'ALL'}";

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
