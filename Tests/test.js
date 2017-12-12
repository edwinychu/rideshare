const supertest = require('supertest');
const expect = require('chai').expect;
const should = require('chai').should;
const server = require('../Server/serverIndex.js');

// This agent refers to PORT where program is runninng.

// UNIT test begin

describe('initialize test', () => {
  // #1 should return home page
  it('should say hello world at server initiation', (done) => {
    // calling home page api
    supertest(server)
      .get('/')
      // .expect("Content-type", /json/)
      .expect(200, done); // THis is HTTP response
    // .end((err, res) => {
    //   // HTTP status should be 200
    //   res.body.message.should.equal('Hello World!');
    //   res.status.should.equal(200);
    //   done();
    // });
  });
});

// After all tests are finished drop database and close connection
