const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const COLLECTION = 'utilizador';
const EXPENSES = 'gastos';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    try {
      const defaultCategories = ["Alimentação", "Entretenimento", "Saúde", "Transporte", "Lazer", "Gastos pessoais"];

      for (const nome of defaultCategories) {
        const catPayload = { nome, utilizador_id: record.id };
        try {
          await db.insert('categorias', catPayload);
        } catch (e) {
          "Failed to create default category:";
        }
      }
    } catch (e) {
      console.warn("Failed to create default categories for new user:", record.id, e && e.message);
    }

    const { password: _pw, ...safe } = record;

    try {
      const numero_conta = String(Math.floor(10000000 + Math.random() * 90000000));
      const contaPayload = { numero_conta, saldo_atual: 1000, utilizador_id: record.id };
      await db.insert('conta', contaPayload);
    } catch (e) {
      console.error("Failed to create default account for new user:", e);
    }
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
    const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '';
    const username = req.body && req.body.username ? String(req.body.username).trim() : '';
    const password = req.body && req.body.password ? String(req.body.password) : '';
    if ((!email && !username) || !password) return res.status(400).json({ error: 'email/username and password required' });

    // Suporte ao admin
    if (username === 'admin' && password === 'admin') {
      if (req.session) {
        req.session.user = { username: 'admin', isAdmin: true };
      }
      return res.json({ username: 'admin', isAdmin: true });
    }

    const found = email ? await db.getByField(COLLECTION, 'email', email) : await db.getByField(COLLECTION, 'username', username);
    if (!found) return res.status(404).json({ ok: false, error: 'Not found' });

    const match = await bcrypt.compare(password, found.password);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    const { password: _pw, ...safe } = found;
    // set session so user is considered logged in
    if (req.session) {
      req.session.user = { id: found.id, username: found.username, email: found.email, nome: found.nome, apelido: found.apelido, isAdmin: false };
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

// change password for logged-in user
async function changePassword(req, res, next) {
  try {
    const user = req.user || (req.session && req.session.user);
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    const id = user.id;
    const currentPassword = req.body && req.body.currentPassword ? String(req.body.currentPassword) : '';
    const newPassword = req.body && req.body.newPassword ? String(req.body.newPassword) : '';
    const confirmPassword = req.body && req.body.confirmPassword ? String(req.body.confirmPassword) : '';

    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ error: 'current, new and confirm passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });
    if (newPassword !== confirmPassword) return res.status(400).json({ error: 'passwords do not match' });

    const meRecord = await db.getById(COLLECTION, id);
    if (!meRecord) return res.status(404).json({ error: 'user not found' });

    const match = await bcrypt.compare(currentPassword, meRecord.password);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(COLLECTION, id, { password: hash });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// transactions history for logged-in user
async function transactions(req, res, next) {
  try {
    const user = req.user || (req.session && req.session.user);
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    // support optional filters: from, to (YYYY-MM-DD)
    const from = req.query && req.query.from ? String(req.query.from) : null;
    const to = req.query && req.query.to ? String(req.query.to) : null;

    // test env uses JSON DB; filter by categories owned by user
    if (process.env.NODE_ENV === 'test') {
      const categories = await db.getAll('categorias');
      const userCatIds = categories.filter((c) => String(c.utilizador_id) === String(user.id)).map((c) => c.id);

      let list = await db.getAll(EXPENSES);
      list = list.filter((r) => userCatIds.some((id) => String(id) === String(r.categoria_id)));

      if (from) list = list.filter((r) => r.data && String(r.data) >= from);
      if (to) list = list.filter((r) => r.data && String(r.data) <= to);

      list.sort((a, b) => {
        if (!a.data || !b.data) return 0;
        return String(b.data).localeCompare(String(a.data));
      });

      return res.json(list);
    }

    //run a SQL JOIN to select only user's transactions
    const sqlParts = ['SELECT g.* FROM `gastos` g JOIN `categorias` c ON g.categoria_id = c.id WHERE c.utilizador_id = ?'];
    const params = [user.id];
    if (from) {
      sqlParts.push('AND g.data >= ?');
      params.push(from);
    }
    if (to) {
      sqlParts.push('AND g.data <= ?');
      params.push(to);
    }
    sqlParts.push('ORDER BY g.data DESC');

    const sql = sqlParts.join(' ');
    const [rows] = await pool.query(sql, params);
    return res.json(rows || []);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, check, remove, login, me, logout, changePassword, transactions };

