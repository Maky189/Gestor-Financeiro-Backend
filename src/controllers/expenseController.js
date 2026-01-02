const db = require("../utils/db");
const COLLECTION = "gastos";
const CATEGORIES = "categorias";

// Get all expenses
async function getAllExpenses(req, res, next) {
  try {
    const expenses = await db.getAll(COLLECTION);
    return res.json(expenses);
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

    const payload = {
      descricao,
      nome,
      preco,
      data: data || new Date().toISOString().slice(0, 10),
      categoria_id: categoriaBD.id,
    };

    const result = await db.insert(COLLECTION, payload);

    return res.status(201).json(result);
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
      payload.categoria_id = cat.id;
    }

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

    const hasDependencies = await checkDependencies(id);
    if (hasDependencies) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete expense with associated records.",
      });
    }

    const result = await db.remove(COLLECTION, id);
    if (!result) {
      return res.status(400).json({
        success: false,
        error: "Failed to delete expenses.",
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
