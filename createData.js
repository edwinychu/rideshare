const cassandra = require('cassandra-driver');
const unique = require('uuid/v4');

const client = new cassandra.Client({ contactPoints: ['127.0.0.1'], keyspace: 'rideshare' });

client.connect();
let counter = 0;
let i = 1483228800;

const createDataByHours = () => {
  const unmatchedRideBatch = [];
  const matchedRideBatch = [];
  for (let j = 0; j < 40; j += 1) {
    const rideId = unique();
    const timeStamp = Math.floor(Math.random() * (i + 60 - i) + i);
    const riderId = Math.floor(Math.random() * 5000000);

    const riderStartLog = (Math.random() * (-121.75 - -122.75) + -122.75).toFixed(2);
    const riderStartLat = (Math.random() * (37.8 - 36.8) + 36.8).toFixed(2);
    const riderStart = `${riderStartLog.toString()} ${riderStartLat.toString()}`;

    const riderEndLog = (Math.random() * (-121.75 - -122.75) + -122.75).toFixed(2);
    const riderEndLat = (Math.random() * (37.8 - 36.8) + 36.8).toFixed(2);
    const riderEnd = `${riderEndLog.toString()} ${riderEndLat.toString()}`;

    const unmatchedRide = {
      ride_id: rideId,
      timestamp: timeStamp,
      rider_id: riderId,
      rider_start: riderStart,
      rider_end: riderEnd,
    };

    // generate extra data for matched db table
    const waitEst = Math.floor(Math.random() * (11 - 1) + 1);
    const driver = Math.floor(Math.random() * 5000000);
    const cancelledStatus = Math.floor(Math.random() * (2 - 0));
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

    const matchedRide = {
      ride_id: rideId,
      timestamp: timeStamp,
      rider_id: riderId,
      rider_start: riderStart,
      rider_end: riderEnd,
      wait_est: waitEst,
      driver_id: driver,
      cancelled: cancelledStatus,
      cancellation_time: cancellationTime,
    };

    // batch up unmatched and matched rides
    const unmatchedRideQuery =
      'INSERT INTO rideshare.unmatched (ride_id, timestamp, rider_id, rider_start, rider_end) VALUES (?, ?, ?, ?, ?)';

    unmatchedRideBatch.push({
      query: unmatchedRideQuery,
      params: [rideId, timeStamp, riderId, riderStart, riderEnd],
    });

    const matchedRideQuery =
      'INSERT INTO rideshare.matched (ride_id, timestamp, rider_id, rider_start, rider_end, wait_est, driver_id, cancelled, cancellation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    matchedRideBatch.push({
      query: matchedRideQuery,
      params: [
        rideId,
        timeStamp,
        riderId,
        riderStart,
        riderEnd,
        waitEst,
        driver,
        cancelledStatus,
        cancellationTime,
      ],
    });
  }
  const batches = {
    unmatched: unmatchedRideBatch,
    matched: matchedRideBatch,
  };
  i += 60;
  return batches;
};

async function saveUnmatchedBatches(unmatchedBatch) {
  await client.batch(unmatchedBatch, { prepare: true }).then(() => {});
}

async function saveMatchedBatches(unmatchedBatch) {
  await client.batch(unmatchedBatch, { prepare: true }).then(() => {
    counter += 40;
    if (counter <= 5000000) {
      addData();
      console.log(counter);
    }
  });
}

async function addData() {
  const batches = await createDataByHours();
  const unmatchedBatch = batches.unmatched;
  const matchedBatch = batches.matched;
  await saveUnmatchedBatches(unmatchedBatch);
  await saveMatchedBatches(matchedBatch);
}

addData();
