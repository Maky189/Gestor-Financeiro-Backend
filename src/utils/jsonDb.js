const fs = require('fs').promises;
const { DB_FILE } = require('../config/database');

// gerar id
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

async function readDB() {
  try {
    const content = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(content || '{}');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

async function writeDB(obj) {
  await fs.mkdir(require('path').dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

async function getCollection(name) {
  const db = await readDB();
  return db[name] || [];
}

async function writeCollection(name, arr) {
  const db = await readDB();
  db[name] = arr;
  await writeDB(db);
}

async function getAll(name) {
  return getCollection(name);
}

async function getById(name, id) {
  const col = await getCollection(name);
  const idStr = String(id);
  return col.find((r) => String(r.id) === idStr) || null;
}

async function insert(name, item) {
  //verificar que existe collections
  const col = await getCollection(name);

  let maxId = col.reduce((m, r) => {
    const n = Number(r && r.id);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);

  // colocar id
  let changed = false;
  for (let i = 0; i < col.length; i++) {
    if (col[i].id === undefined || col[i].id === null) {
      maxId += 1;
      col[i].id = maxId;
      changed = true;
    }
  }

  if (changed) {
    // persist migration
    await writeCollection(name, col);
  }
  
  const newId = maxId + 1;
  const record = { id: newId, ...item };
  col.push(record);
  await writeCollection(name, col);
  return record;
}

async function update(name, id, changes) {
  const col = await getCollection(name);
  const idStr = String(id);
  const idx = col.findIndex((r) => String(r.id) === idStr);
  if (idx === -1) return null;
  col[idx] = { ...col[idx], ...changes };
  await writeCollection(name, col);
  return col[idx];
}

async function remove(name, id) {
  const col = await getCollection(name);
  const idStr = String(id);
  const idx = col.findIndex((r) => String(r.id) === idStr);
  if (idx === -1) return false;
  col.splice(idx, 1);
  await writeCollection(name, col);
  return true;
}

module.exports = {
  readDB,
  writeDB,
  getAll,
  getById,
  insert,
  update,
  remove,
};
