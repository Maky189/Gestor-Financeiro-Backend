// Use JSON-backed DB during tests to avoid external DB dependency
if (process.env.NODE_ENV === 'test') {
  module.exports = require('./jsonDb');
}
else {
  const pool = require('../config/database');

  // Generic helper for table operations. Assumes table has an `id` PK.
  async function getAll(table) {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    return rows;
  }

  async function getById(table, id) {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async function getByField(table, field, value) {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE \`${field}\` = ? LIMIT 1`, [value]);
    return rows[0] || null;
  }

  async function exists(table, field, value) {
    const [rows] = await pool.query(`SELECT 1 FROM \`${table}\` WHERE \`${field}\` = ? LIMIT 1`, [value]);
    return rows.length > 0;
  }

  async function insert(table, item) {
    // Build columns and values
    const keys = Object.keys(item);
    const placeholders = keys.map(() => '?').join(', ');
    const cols = keys.map((k) => `\`${k}\``).join(', ');
    const values = keys.map((k) => item[k]);

    const [result] = await pool.query(
      `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
      values
    );

    const insertedId = result.insertId;
    return getById(table, insertedId);
  }

  async function update(table, id, changes) {
    const keys = Object.keys(changes);
    if (keys.length === 0) return getById(table, id);
    const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');
    const values = keys.map((k) => changes[k]);
    values.push(id);

    await pool.query(`UPDATE \`${table}\` SET ${setClause} WHERE id = ?`, values);
    return getById(table, id);
  }

  // Se field e value forem passados, remove por campo customizado (ex: categoria_id)
  async function remove(table, id, field, value) {
    if (field && value !== undefined) {
      const [result] = await pool.query(`DELETE FROM \`${table}\` WHERE \`${field}\` = ?`, [value]);
      return result.affectedRows > 0;
    } else {
      const [result] = await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
      return result.affectedRows > 0;
    }
  }

  module.exports = {
    getAll,
    getById,
    getByField,
    exists,
    insert,
    update,
    remove,
  };
}