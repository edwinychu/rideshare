// const newrelic = require('newrelic');
const http = require('http');
const db = require('../Database/dbIndex.js');
const unique = require('uuid/v4');

const port = 8080;
const server = http.createServer((req, res) => {
  const headers = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, accept',
    'access-control-max-age': 10, // Seconds.
    'Content-Type': 'application/json',
  };
  if (req.method === 'POST') {
    // polling
    if (req.url === '/polling') {
    }
    // bookings
    if (req.url === '/bookings') {
      let riderInfo = '';
      req.on('data', (data) => {
        riderInfo += data;
      });
      req.on('end', () => {
        riderInfo = JSON.parse(riderInfo);
        // const startLoc = `POINT(${riderInfo.start_loc})`;
        riderInfo.ride_id = unique();
        riderInfo.timestamp = Math.round(Date.now() / 1000);
        db.saveUnmatchedRideInfo(riderInfo);
        // const inventoryRideInfo = {
        //   start_loc: startLoc,
        //   ride_id: rideId,
        // };
        // await axios.post('http://localhost:8080/new_ride', inventoryRideInfo).catch((err) => {});
        res.end();
        // res.send(rideId);
      });
    }
    // new_ride
    if (req.url === '/new_ride') {
      res.end();
    }
    // updated
    if (req.url === '/updated') {
    }
    // cancelled
    if (req.url === '/cancelled') {
    }
    // message_bus
    if (req.url === '/message_bus') {
    }
    //
    if (req.url === '/polling') {
    }
  }
  if (req.method === 'GET') {
    if (req.url === '/') {
      res.writeHead(200, headers);
      res.json({ message: 'Hello World!' });
    }
  }
});
const ip = '127.0.0.1';
console.log(`Listening on http://${ip}:${port}`);
server.listen(port, ip);
