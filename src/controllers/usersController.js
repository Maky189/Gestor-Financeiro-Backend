const db = require('../utils/jsonDb');
const bcrypt = require('bcryptjs');

const COLLECTION = 'users';

// lista de users
async function list(req, res, next) {
  try {
    const users = await db.getAll(COLLECTION);
    const safe = users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
    res.json(safe);
  } catch (err) {
    next(err);
  }
}

// criando users e validando os dados 
async function create(req, res, next) {
  try {
    // preferir valores normalizados do middleware 
    const username = req.validated && req.validated.username ? req.validated.username : (req.body && req.body.username ? String(req.body.username).trim() : '');
    const email = req.validated && req.validated.email ? req.validated.email : (req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '');
    const password = req.validated && req.validated.password ? req.validated.password : (req.body && req.body.password ? String(req.body.password) : '');

    const users = await db.getAll(COLLECTION);
    const exists = users.some((u) => (u.username && String(u.username).toLowerCase() === username.toLowerCase()) || (u.email && String(u.email).toLowerCase() === email.toLowerCase()));
    if (exists) return res.status(409).json({ error: 'user already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const record = await db.insert(COLLECTION, { username, email, passwordHash, createdAt: new Date().toISOString() });

    const { passwordHash: _ph, ...safe } = record;
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
}

// Remove by username
async function remove(req, res, next) {
  try {
    const username = req.params.username;
    if (!username) return res.status(400).json({ error: 'username required' });

    const users = await db.getAll(COLLECTION);
    const idx = users.findIndex((u) => String(u.username).toLowerCase() === String(username).toLowerCase());
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const record = users[idx];
    if (record.id) {
      await db.remove(COLLECTION, record.id);
    } else {
      const newCol = users.slice(0, idx).concat(users.slice(idx + 1));
      const whole = await db.readDB();
      whole[COLLECTION] = newCol;
      await db.writeDB(whole);
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function check(req, res, next) {
  try {
    const username = req.params.username;
    if (!username) return res.status(400).json({ error: 'username required' });
    const users = await db.getAll(COLLECTION);
    const found = users.some((u) => String(u.username).toLowerCase() === String(username).toLowerCase());
    if (found) return res.json({ ok: true });
    return res.status(404).json({ ok: false, error: 'Not found' });
  } catch (err) {
    next(err);
  }
}

// login com email e password
async function login(req, res, next) {
  try {
    const email = req.validated && req.validated.email ? req.validated.email : (req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '');
    const password = req.validated && req.validated.password ? req.validated.password : (req.body && req.body.password ? String(req.body.password) : '');

    // encontrar user por email (middleware validou)
    const user = await db.getByField(COLLECTION, 'email', email);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove, check, login };
