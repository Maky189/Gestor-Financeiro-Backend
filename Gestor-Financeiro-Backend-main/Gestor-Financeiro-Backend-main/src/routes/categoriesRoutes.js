const express = require("express");
const router = express.Router();
const ensureAuth = require('../middleware/ensureAuth');

const categoriesController = require("../controllers/categoriesController");

router.use(ensureAuth);

// Route to get all categories
router.get("/", categoriesController.getAllCategories);

// Route to create a new category
router.post("/", categoriesController.createCategory);


module.exports = router;
