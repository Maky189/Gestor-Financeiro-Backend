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
      .send({ username: 'testuser', password: 'secret123' })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('username', 'testuser');
    // should set a session cookie so the user is logged in
    expect(res.headers).to.have.property('set-cookie');
    const cookies = res.headers['set-cookie'].join('\n');
    expect(cookies).to.match(/connect.sid/);
    expect(res.body).to.not.have.property('passwordHash');
  });

  it('should reject wrong password', async function () {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: 'testuser', password: 'wrong' })
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

  it('should change password and login with new password', async function () {
    const agent = request.agent(app);

    // create user
    const createRes = await agent
      .post('/api/users')
      .send({ nome: 'P1', apelido: 'User', username: 'puser', email: 'p1@example.com', morada: 'Addr', telefone: '000', password: 'pass123', confirmpassword: 'pass123' })
      .set('Accept', 'application/json');
    expect(createRes.status).to.equal(201);

    const change = await agent
      .put('/api/users/password')
      .send({ currentPassword: 'pass123', newPassword: 'newpass123', confirmPassword: 'newpass123' })
      .set('Accept', 'application/json');
    expect(change.status).to.equal(200);

    // logout and try logging in with new password
    await agent.post('/api/users/logout');
    const login = await request(app)
      .post('/api/users/login')
      .send({ email: 'p1@example.com', password: 'newpass123' })
      .set('Accept', 'application/json');
    expect(login.status).to.equal(200);
  });

  it('should return transactions history and apply date filters', async function () {
    // create a user to own the category
    const agent = request.agent(app);
    const createRes = await agent
      .post('/api/users')
      .send({ nome: 'H1', apelido: 'User', username: 'huser', email: 'h1@example.com', morada: 'Addr', telefone: '000', password: 'pass123', confirmpassword: 'pass123' })
      .set('Accept', 'application/json');
    expect(createRes.status).to.equal(201);

    // create a category for the user
    const cat = await request(app)
      .post('/api/categories')
      .send({ nome: 'Food', descricao: 'Food expenses', username: 'huser' })
      .set('Accept', 'application/json');
    expect(cat.status).to.equal(201);

    // create spendings
    const s1 = await request(app).post('/api/spendings').send({ descricao: 'Lunch', nome: 'Lunch place', preco: 12.5, data: '2025-01-02', categoria: 'Food' });
    expect(s1.status).to.equal(201);
    const s2 = await request(app).post('/api/spendings').send({ descricao: 'Coffee', nome: 'Cafe', preco: 3.0, data: '2025-01-01', categoria: 'Food' });
    expect(s2.status).to.equal(201);

    // get transactions (no filters)
    const tx = await agent.get('/api/users/transactions');
    expect(tx.status).to.equal(200);
    expect(tx.body).to.be.an('array');
    expect(tx.body.length).to.be.at.least(2);
    // Verify sorting: first item should have later date (string comparison)
    expect((tx.body[0].data >= tx.body[1].data)).to.equal(true);

    // apply date filter
    const filtered = await agent.get('/api/users/transactions?from=2025-01-02&to=2025-01-02');
    expect(filtered.status).to.equal(200);
    expect(filtered.body).to.be.an('array');
    expect(filtered.body.every((r) => r.data === '2025-01-02')).to.equal(true);
  });
});