const db = require("../utils/db");
const COLLECTION = "categorias";

// Get all categories
async function getAllCategories(req, res, next) {
  try {
    const categories = await db.getAll(COLLECTION);
    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Failed to list categories:", error);
    next(error);
  }
}

// Create a new category
async function createCategory(req, res, next) {
  try {
    const { nome, utilizador_id } = req.body;
    if (nome == null || !utilizador_id) {
      return res
        .status(400)
        .json({ success: false, error: "Required fields are missing" });
    }

    const payload = { nome, utilizador_id };
    const result = await db.insert(COLLECTION, payload);
    return res.status(201).json({
      success: true,
      data: result,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Failed to create category:", error);
    next(error);
  }
}

// Update an existing category
async function updateCategory(req, res, next) {
  try {
    const { nome, utilizador_id } = req.body;
    const { id } = req.params;
    if (id == null) {
      return res
        .status(400)
        .json({ success: false, error: "Category ID is required." });
    }
    const payload = {};
    if (nome !== undefined) payload.nome = nome;
    if (utilizador_id !== undefined) payload.utilizador_id = utilizador_id;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one field must be provided for update.",
      });
    }

    const result = await db.update(COLLECTION, id, payload);

    if (!result || result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found." });
    }

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

// Delete a category
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    if (id == null) {
      return res
        .status(400)
        .json({ success: false, error: "Category ID is required." });
    }
    const result = await db.remove(COLLECTION, id);

    if (!result || result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found." });
    }

    return res.json({
      success: true,
      message: "Category deleted successfully.",
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
