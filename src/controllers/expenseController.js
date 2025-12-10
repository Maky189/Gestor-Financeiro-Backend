const db = require("../utils/db");
const COLLECTION = "gastos";

// Get all expenses
async function getAllExpenses(req, res, next) {
  try {
    const expenses = await db.getAll(COLLECTION);
    return res.json({ success: true, data: expenses });
  } catch (err) {
    console.error("Failed to list expenses: ", err);
    next(err);
  }
}

// Create a new expense
async function createExpenses(req, res, next) {
  try {
    const { descricao, gasto, preco, data, categoria_id } = req.body;

    if (!descricao || !gasto || !categoria_id) {
      return res.status(400).json({
        success: false,
        error: "Required fields are missing.",
      });
    }

    const now = new Date();
    const data_formatada = data ? data : now.toISOString().slice(0, 10);

    const payload = {
      descricao,
      gasto,
      preco,
      data: data_formatada,
      categoria_id,
    };

    const result = await db.insert(COLLECTION, payload);

    return res.status(201).json({
      success: true,
      data: result,
      message: "Expense created successfully.",
    });
  } catch (err) {
    console.error("Error creating expenses: ", err);
    next(err);
  }
}

// Update existing expense
async function updateExpenses(req, res, next) {
  try {
    const { descricao, gasto, preco, data, categoria_id } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Expenses ID is required.",
      });
    }

    // Payload seguro (evita gravar NULL acidentalmente)
    const payload = {};
    if (descricao !== undefined) payload.descricao = descricao;
    if (gasto !== undefined) payload.gasto = gasto;
    if (preco !== undefined) payload.preco = preco;
    if (data !== undefined) payload.data = data;
    if (categoria_id !== undefined) payload.categoria_id = categoria_id;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one field must be provided for update.",
      });
    }

    const result = await db.update(COLLECTION, id, payload);

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Expenses not found.",
      });
    }

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
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Expenses ID is required.",
      });
    }

    const result = await db.remove(COLLECTION, id);

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Expenses not found.",
      });
    }

    return res.json({
      success: true,
      message: "Expenses deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting expenses: ", err);
    next(err);
  }
}

module.exports = {
  getAllExpenses,
  createExpenses,
  updateExpenses,
  deleteExpenses,
};
