const environment = process.env.NODE_ENV || 'development';
const redis = require('redis');

const config = {
  development: {
    client: '',
    connection: {
      host: 'localhost',
      port: '6379',
    },
  },
  production: {
    client: '',
    connection: {
      host: process.env.REDIS_PORT,
      port: process.env.REDIS_HOST,
      auth: process.env.REDIS_PASS,
    },
  },
};

const redisClient = redis.createClient(config[environment].connection);

module.exports = redisClient;
