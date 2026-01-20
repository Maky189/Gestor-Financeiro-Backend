const db = require("../utils/db");
const pool = require("../config/database");
const COLLECTION = "gastos";
const CATEGORIES = "categorias";

// Get all expenses for current logged-in user (based on category -> user)
async function getAllExpenses(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const [rows] = await pool.query(
      `SELECT g.* FROM gastos g JOIN categorias c ON g.categoria_id = c.id WHERE c.utilizador_id = ?`,
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error("Failed to list expenses: ", err);
    next(err);
  }
}

// Create a new expense
async function createExpenses(req, res, next) {
  const { descricao, nome, preco, data, categoria, categoria_id } = req.body;
  if (!descricao || !nome || !preco || (!categoria && !categoria_id)) {
    return res.status(400).json({
      success: false,
      error: "Required fields are missing.",
    });
  }

  try {
    let categoriaBD = null;
    if (categoria) {
      categoriaBD = await db.getByField("categorias", "nome", categoria);
    } else {
      categoriaBD = await db.getByField("categorias", "id", categoria_id);
    }

    if (!categoriaBD) {
      return res.status(400).json({
        success: false,
        error: "Category does not exist.",
      });
    }

    // ensure the category belongs to the logged-in user
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    if (String(categoriaBD.utilizador_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }

    // ensure user has an account
    const account = await db.getByField('conta', 'utilizador_id', userId);
    if (!account) {
      return res.status(400).json({ success: false, error: 'account not found' });
    }

    // perform insert and related updates in a transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const insertQuery = 'INSERT INTO gastos (descricao, nome, preco, data, categoria_id) VALUES (?, ?, ?, ?, ?)';
      const insertParams = [descricao, nome, preco, data || new Date().toISOString().slice(0, 10), categoriaBD.id];
      const [insertResult] = await conn.query(insertQuery, insertParams);
      const expenseId = insertResult.insertId;

      // decrement account balance
      await conn.query('UPDATE conta SET saldo_atual = saldo_atual - ? WHERE utilizador_id = ?', [preco, userId]);

      // increase category total
      await conn.query('UPDATE categorias SET total_categoria = total_categoria + ? WHERE id = ?', [preco, categoriaBD.id]);

      await conn.commit();

      const created = await db.getById(COLLECTION, expenseId);
      return res.status(201).json(created);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error creating expenses: ", err);
    next(err);
  }
}

// Update existing expense
async function updateExpenses(req, res, next) {
  const { descricao, nome, preco, data, categoria } = req.body;
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Expenses ID is required.",
    });
  }

  try {
    const payload = {};
    if (descricao !== undefined) payload.descricao = descricao;
    if (nome !== undefined) payload.nome = nome;
    if (preco !== undefined) payload.preco = preco;
    if (data !== undefined) payload.data = data;
    if (categoria !== undefined) {
      const cat = await db.getByField("categorias", "nome", categoria);
      if (!cat) {
        return res.status(400).json({
          success: false,
          error: "Category does not exist.",
        });
      }
      // ensure category belongs to user
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ error: 'unauthorized' });
      if (String(cat.utilizador_id) !== String(userId)) {
        return res.status(403).json({ success: false, error: 'forbidden' });
      }
      payload.categoria_id = cat.id;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one field must be provided for update.",
      });
    }

    // ensure the expense exists and is owned by user (via category)
    const existing = await db.getById(COLLECTION, id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Expenses not found.' });
    }
    const catOfExisting = await db.getById(CATEGORIES, existing.categoria_id);
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    if (!catOfExisting || String(catOfExisting.utilizador_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }

    // if price or category changed, update category totals and account balance atomically
    const priceOld = Number(existing.preco || 0);
    const priceNew = payload.preco !== undefined ? Number(payload.preco) : priceOld;
    const oldCategoryId = existing.categoria_id;
    const newCategoryId = payload.categoria_id !== undefined ? payload.categoria_id : oldCategoryId;

    if (priceOld !== priceNew || String(oldCategoryId) !== String(newCategoryId)) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // adjust categories totals
        if (String(oldCategoryId) === String(newCategoryId)) {
          const delta = priceNew - priceOld;
          if (delta !== 0) {
            await conn.query('UPDATE categorias SET total_categoria = total_categoria + ? WHERE id = ?', [delta, oldCategoryId]);
          }
        } else {
          // moved category: subtract old price from old category and add new price to new category
          await conn.query('UPDATE categorias SET total_categoria = total_categoria - ? WHERE id = ?', [priceOld, oldCategoryId]);
          await conn.query('UPDATE categorias SET total_categoria = total_categoria + ? WHERE id = ?', [priceNew, newCategoryId]);
        }

        // adjust account balance (user's account)
        const deltaAccount = priceNew - priceOld; // if positive, user pays more -> subtract more
        if (deltaAccount !== 0) {
          await conn.query('UPDATE conta SET saldo_atual = saldo_atual - ? WHERE utilizador_id = ?', [deltaAccount, userId]);
        }

        // perform update on expense
        const keys = Object.keys(payload);
        const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');
        const values = keys.map((k) => payload[k]);
        values.push(id);
        await conn.query(`UPDATE \`${COLLECTION}\` SET ${setClause} WHERE id = ?`, values);

        await conn.commit();

        const updated = await db.getById(COLLECTION, id);
        return res.json({ success: true, data: updated, message: 'Expenses updated successfully.' });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    // no price/category changes — simple update
    const result = await db.update(COLLECTION, id, payload);

    return res.json({
      success: true,
      data: { id, ...payload },
      message: "Expenses updated successfully.",
    });
  } catch (err) {
    console.error("Error updating expenses: ", err);
    next(err);
  }
}

// Delete an expense
async function deleteExpenses(req, res, next) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Expenses ID is required.",
    });
  }

  try {
    const expense = await db.getById(COLLECTION, id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expenses not found.",
      });
    }

    // ensure expense belongs to user via its category
    const cat = await db.getById(CATEGORIES, expense.categoria_id);
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    if (!cat || String(cat.utilizador_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }

    const hasDependencies = await checkDependencies(id);
    if (hasDependencies) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete expense with associated records.",
      });
    }

    // perform deletion and related adjustments in a transaction: refund to account and deduct from category total
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // refund account
      await conn.query('UPDATE conta SET saldo_atual = saldo_atual + ? WHERE utilizador_id = ?', [expense.preco, userId]);

      // subtract from category total
      await conn.query('UPDATE categorias SET total_categoria = total_categoria - ? WHERE id = ?', [expense.preco, expense.categoria_id]);

      // delete expense
      await conn.query('DELETE FROM gastos WHERE id = ?', [id]);

      await conn.commit();

      return res.json({ success: true, message: 'Expenses deleted successfully.' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error deleting expenses: ", err);
    next(err);
  }
}

async function checkDependencies(expenseId) {
  const [rows] = await pool.query('SELECT 1 FROM chaves WHERE gasto_id = ? LIMIT 1', [expenseId]);
  return rows.length > 0;
}

module.exports = {
  getAllExpenses,
  createExpenses,
  updateExpenses,
  deleteExpenses,
};
