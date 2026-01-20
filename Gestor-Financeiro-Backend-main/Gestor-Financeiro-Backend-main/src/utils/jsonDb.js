const fs = require('fs').promises;
const path = require('path');
const { DB_FILE } = require('../config/database');

// escrita simples na memoria para evitar corrupcao concorrente
let writeLock = Promise.resolve();
function withWriteLock(fn) {
  // esperar a ultima escrita terminar antes de iniciar nova
  const op = writeLock.then(() => fn());
  //erros nao bloqueiam a fila
  writeLock = op.catch(() => {});
  return op;
}

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
  // serialize writes to avoid concurrent write races
  return withWriteLock(async () => {
    await fs.mkdir(require('path').dirname(DB_FILE), { recursive: true });
    // write to a temp file then rename for atomicity
    const tmp = DB_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
    await fs.rename(tmp, DB_FILE);
  });
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

// get first record matching field === value (case-insensitive for strings)
async function getByField(name, field, value) {
  const col = await getCollection(name);
  if (typeof value === 'string') {
    const val = value.toLowerCase();
    return col.find((r) => r[field] && String(r[field]).toLowerCase() === val) || null;
  }
  return col.find((r) => r[field] === value) || null;
}

async function exists(name, field, value) {
  const rec = await getByField(name, field, value);
  return !!rec;
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
  getByField,
  exists,
};