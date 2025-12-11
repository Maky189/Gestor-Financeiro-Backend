const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { expect } = require('chai');

// use a separate DB file for tests to avoid clobbering real data
process.env.NODE_ENV = 'test';
process.env.TEST_DB_FILE = path.resolve(__dirname, 'db.test.json');

// ensure test DB starts empty
if (fs.existsSync(process.env.TEST_DB_FILE)) {
  fs.unlinkSync(process.env.TEST_DB_FILE);
}

const app = require('./app');

describe('Users API', function () {
  after(function () {
    // cleanup test db
    try { fs.unlinkSync(process.env.TEST_DB_FILE); } catch (e) {}
  });

  it('should create a user', async function () {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'testuser', email: 'test@example.com', password: 'secret123' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('username', 'testuser');
    expect(res.body).to.have.property('email', 'test@example.com');
    expect(res.body).to.not.have.property('passwordHash');
  });

  it('should not create duplicate user by email', async function () {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'another', email: 'test@example.com', password: 'secret123' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(409);
  });

  it('should reject invalid email', async function () {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'u2', email: 'invalid-email', password: 'secret123' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(400);
  });

  it('should login with correct credentials', async function () {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'secret123' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('email', 'test@example.com');
    expect(res.body).to.not.have.property('passwordHash');
  });

  it('should reject wrong password', async function () {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(401);
  });
});
