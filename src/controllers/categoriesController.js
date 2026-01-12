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
  const { nome, descricao } = req.body;
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'unauthorized' });
  if (!nome || !descricao) {
    return res
      .status(400)
      .json({ success: false, error: "Required fields are missing" });
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

    const payload = { nome, descricao, utilizador_id };
    const result = await db.insert(COLLECTION, payload);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Failed to create category:", error);
    next(error);
  }
}

module.exports = {
  getAllCategories,
  createCategory,
};
