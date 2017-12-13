const cassandra = require('cassandra-driver');
const async = require('async');

const client = new cassandra.Client({ contactPoints: ['127.0.0.1'], keyspace: 'rideshare' });

const createTables = () => {


};

const insertInto = (table) => {
  client.execute(
    "SELECT lastname, age, city, email, firstname FROM users WHERE lastname='Jones'",
    (err, result) => {
      if (!err) {
        if (result.rows.length > 0) {
          const user = result.rows[0];
          console.log('name = %s, age = %d', user.firstname, user.age);
        } else {
          console.log('No results');
        }
      }

      // Run next function in series
      callback(err, null);
    },
  );
};

module.exports = createTables;
moduel.exports = insertInto;
