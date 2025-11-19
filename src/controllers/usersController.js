const db = require('../utils/jsonDb');

const COLLECTION = 'users';

// List users
async function list(req, res, next) {
  try {
    const users = await db.getAll(COLLECTION);
    res.json(users);
  } catch (err) {
    next(err);
  }
}

// create users
async function create(req, res, next) {
  try {
    const username = req.body && req.body.username ? String(req.body.username).trim() : '';
    if (!username) return res.status(400).json({ error: 'username required' });

    const users = await db.getAll(COLLECTION);
    const exists = users.some((u) => String(u.username).toLowerCase() === username.toLowerCase());
    if (exists) return res.status(409).json({ error: 'user already exists' });

    const record = await db.insert(COLLECTION, { username });
    res.status(201).json(record);
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

module.exports = { list, create, remove, check };
