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
      .send({ nome: 'Test', apelido: 'User', username: 'testuser', email: 'test@example.com', morada: 'Somewhere 123', telefone: '123456789', password: 'secret123', confirmpassword: 'secret123' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('username', 'testuser');
    expect(res.body).to.have.property('email', 'test@example.com');
    expect(res.body).to.have.property('morada', 'Somewhere 123');
    expect(res.body).to.have.property('telefone', '123456789');
    // should set a session cookie so the user is logged in
    expect(res.headers).to.have.property('set-cookie');
    const cookies = res.headers['set-cookie'].join('\n');
    expect(cookies).to.match(/connect.sid/);
    expect(res.body).to.not.have.property('passwordHash');
  });

  it('should not create duplicate user by email', async function () {
    const res = await request(app)
      .post('/api/users')
      .send({ nome: 'Another', apelido: 'User', username: 'another', email: 'test@example.com', morada: 'Somewhere 456', telefone: '987654321', password: 'secret123', confirmpassword: 'secret123' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(409);
  });

  it('should reject invalid email', async function () {
    const res = await request(app)
      .post('/api/users')
      .send({ nome: 'U2', apelido: 'Invalid', username: 'u2', email: 'invalid-email', morada: 'Addr', telefone: '000', password: 'secret123', confirmpassword: 'secret123' })
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
    // should set a session cookie so the user is logged in
    expect(res.headers).to.have.property('set-cookie');
    const cookies = res.headers['set-cookie'].join('\n');
    expect(cookies).to.match(/connect.sid/);
    expect(res.body).to.not.have.property('passwordHash');
  });

  it('should reject wrong password', async function () {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(401);
  });

  it('session persists and /me returns current user, and logout destroys session', async function () {
    const agent = request.agent(app);

    // signup with agent so cookie is kept
    const createRes = await agent
      .post('/api/users')
      .send({ nome: 'Sess', apelido: 'User', username: 'sessuser', email: 'sess@example.com', morada: 'Addr', telefone: '000', password: 'pass123', confirmpassword: 'pass123' })
      .set('Accept', 'application/json');
    expect(createRes.status).to.equal(201);

    // call /me with same agent — should return the user from session
    const me = await agent.get('/api/users/me');
    expect(me.status).to.equal(200);
    expect(me.body).to.have.property('email', 'sess@example.com');

    // logout
    const out = await agent.post('/api/users/logout');
    expect(out.status).to.equal(200);

    // /me should now be unauthorized
    const me2 = await agent.get('/api/users/me');
    expect(me2.status).to.equal(401);
  });
});