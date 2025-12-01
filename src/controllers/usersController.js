const db = require('../utils/db');
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
    const confirmpassword = req.validated && req.validated.confirmpassword ? req.validated.confirmpassword : (req.body && req.body.confirmpassword ? String(req.body.confirmpassword) : '');


    const existingByUsername = await db.getByField(COLLECTION, 'username', username);
    const existingByEmail = await db.getByField(COLLECTION, 'email', email);
    if (existingByUsername || existingByEmail) return res.status(409).json({ error: 'user already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    // Formato para MariaDB
    const now = new Date();
    const createdAt = now.toISOString().slice(0, 19).replace('T', ' ');
    const record = await db.insert(COLLECTION, { username, email, passwordHash, createdAt });

    const { passwordHash: _ph, ...safe } = record;
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
}

async function check(req, res, next) {
  try {
    const username = req.params.username;
    if (!username) return res.status(400).json({ error: 'username required' });
    const found = await db.getByField(COLLECTION, 'username', username);
    if (!found) return res.status(404).json({ ok: false, error: 'Not found' });
    // Return full user record (including passwordHash)
    return res.json(found);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const username = req.body && req.body.username ? String(req.body.username).trim() : '';
    if (!username) return res.status(400).json({ error: 'username required' });
    
    const found = await db.getByField(COLLECTION, 'username', username);
    if (!found) return res.status(404).json({ error: 'user not found' });
    
    const deleted = await db.remove(COLLECTION, found.id);
    if (deleted) {
      return res.json({ ok: true, message: `User ${username} deleted` });
    }
    return res.status(500).json({ error: 'failed to delete user' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, check, remove };
