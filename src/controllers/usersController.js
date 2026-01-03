const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const COLLECTION = 'utilizador';

// lista de users
async function list(req, res, next) {
  try {
    const users = await db.getAll(COLLECTION);
    const safe = users.map((u) => {
      const { password, ...rest } = u;
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
    const nome = req.validated && req.validated.nome ? req.validated.nome : (req.body && req.body.nome ? String(req.body.nome).trim() : '');
    const apelido = req.validated && req.validated.apelido ? req.validated.apelido : (req.body && req.body.apelido ? String(req.body.apelido).trim() : '');
    const username = req.validated && req.validated.username ? req.validated.username : (req.body && req.body.username ? String(req.body.username).trim() : '');
    const email = req.validated && req.validated.email ? req.validated.email : (req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '');
    const morada = req.validated && req.validated.morada ? req.validated.morada : (req.body && req.body.morada ? String(req.body.morada).trim() : '');
    const telefone = req.validated && req.validated.telefone ? req.validated.telefone : (req.body && req.body.telefone ? String(req.body.telefone).trim() : '');
    const password = req.validated && req.validated.password ? req.validated.password : (req.body && req.body.password ? String(req.body.password) : '');

    const existingByUsername = await db.getByField(COLLECTION, 'username', username);
    const existingByEmail = await db.getByField(COLLECTION, 'email', email);
    if (existingByUsername || existingByEmail) return res.status(409).json({ error: 'user already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    const now = new Date();
    const createdAt = now.toISOString().slice(0, 19).replace('T', ' ');
    const payload = {
      nome,
      apelido,
      username,
      email,
      morada,
      telefone,
      password: passwordHash,
      hora_de_registo: createdAt,
    };

    const record = await db.insert(COLLECTION, payload);

    const { password: _pw, ...safe } = record;
    // establish session so user is logged in after registration
    if (req.session) {
      req.session.user = { id: record.id, username: record.username, email: record.email };
    }
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const username = req.body && req.body.username ? String(req.body.username).trim() : '';
    const password = req.body && req.body.password ? String(req.body.password) : '';
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const found = await db.getByField(COLLECTION, 'username', username);
    if (!found) return res.status(404).json({ ok: false, error: 'Not found' });

    const match = await bcrypt.compare(password, found.password);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    const { password: _pw, ...safe } = found;
    // set session so user is considered logged in
    if (req.session) {
      req.session.user = { id: found.id, username: found.username, email: found.email };
    }
    return res.json(safe);
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

module.exports = { list, create, check, remove, login };

async function me(req, res, next) {
  try {
    if (req.session && req.session.user) {
      return res.json(req.session.user);
    }
    return res.status(401).json({ error: 'unauthorized' });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) return next(err);
        // clear cookie (client will remove it)
        res.clearCookie(process.env.SESSION_NAME || 'connect.sid');
        return res.json({ ok: true });
      });
    } else {
      return res.json({ ok: true });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, check, remove, login, me, logout };

