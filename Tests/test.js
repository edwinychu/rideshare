const supertest = require('supertest');
const { expect } = require('chai');
const server = require('../Server/serverIndex.js');

describe('Test Group', () => {
  describe('Testing initial routes', () => {
    it('should say hello world at server initiation', (done) => {
      // calling home page api
      supertest(server)
        .get('/')
        .expect(200, done); // THis is HTTP response
    });
    it('should return a status code of 404 for all other GET requests', (done) => {
      supertest(server)
        .get('/foo/bar')
        .expect(404, done);
    });

    it('Should return a status code of 404 for all other POST requests', (done) => {
      supertest(server)
        .post('/foo/bar')
        .expect(404, done);
    });

    it('Should return a status code of 404 for a GET request to /search without parameters', (done) => {
      supertest(server)
        .get('/search')
        .expect(404, done);
    });
  });
});
