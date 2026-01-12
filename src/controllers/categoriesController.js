const pool = require("../config/database");
const db = require("../utils/db");
const COLLECTION = "categorias";
const USERS = "utilizador";

// Get all categories (for current logged in user)
async function getAllCategories(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const all = await db.getAll(COLLECTION);
    const categories = all.filter((c) => String(c.utilizador_id) === String(userId));
    return res.json(categories);
  } catch (error) {
    console.error("Failed to list categories:", error);
    next(error);
  }
}

// Create a new category (for current logged-in user)
async function createCategory(req, res, next) {
  const { nome } = req.body;
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'unauthorized' });
  if (!nome) {
    return res
      .status(400)
      .json({ success: false, error: "Required field is missing" });
  }

  try {
    const utilizador_id = userId;

    const allCategories = await db.getAll(COLLECTION);
    const duplicate = allCategories.some((c) => {
      if (!c) return false;
      const sameName =
        typeof c.nome === 'string' && typeof nome === 'string'
          ? c.nome.toLowerCase() === nome.toLowerCase()
          : c.nome === nome;
      return (
        sameName && String(c.utilizador_id) === String(utilizador_id)
      );
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: "Category already exists for this user.",
      });
    }

    const payload = { nome, utilizador_id };
    const result = await db.insert(COLLECTION, payload);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Failed to create category:", error);
    next(error);
  }
}

// Update an existing category (only owner may update)
async function updateCategory(req, res, next) {
  const { id } = req.params;
  const { nome, descricao } = req.body;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "Category ID is required." });
  }

  try {
    const category = await db.getById(COLLECTION, id);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found.' });

    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    if (String(category.utilizador_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }

    const payload = {};
    if (nome !== undefined) payload.nome = nome;
    if (descricao !== undefined) payload.descricao = descricao;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one field must be provided for update.",
      });
    }

    const result = await db.update(COLLECTION, id, payload);

    return res.json({
      success: true,
      data: { id, ...payload },
      message: "Category updated successfully.",
    });
  } catch (err) {
    console.error("Error updating category: ", err);
    next(err);
  }
}

// Delete a category (only owner, and only if no related expenses)
async function deleteCategory(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "Category ID is required." });
  }

  try {
    const category = await db.getById(COLLECTION, id);
    if (!category) {
      console.warn(`Attempter to delete non-existing category: ${id}`);
      return res
        .status(404)
        .json({ success: false, error: "Category not found." });
    }

    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    if (String(category.utilizador_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }

    const [gastos] = await pool.query(
      "SELECT 1 FROM gastos WHERE categoria_id = ? LIMIT 1",
      [id]
    );
    if (gastos.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This category has associated expenses and cannot be deleted.",
        data: category,
      });
    }

    await db.remove(COLLECTION, id);
    return res.json({
      success: true,
      message: "Category deleted successfully.",
      data: category,
    });
  } catch (err) {
    console.error("Error deleting category: ", err);
    next(err);
  }
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
