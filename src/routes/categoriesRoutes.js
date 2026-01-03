const express = require("express");
const router = express.Router();
const ensureAuth = require('../middleware/ensureAuth');

const categoriesController = require("../controllers/categoriesController");

// protect all category routes
router.use(ensureAuth);

// Route to get all categories
router.get("/", categoriesController.getAllCategories);

// Route to create a new category
router.post("/", categoriesController.createCategory);

// Route to update an existing category
router.put("/:id", categoriesController.updateCategory);

// Route to delete a category
router.delete("/:id", categoriesController.deleteCategory);

module.exports = router;
