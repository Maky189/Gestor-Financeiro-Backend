const express = require("express");
const router = express.Router();
const ensureAuth = require('../middleware/ensureAuth');
const expenseController = require("../controllers/expenseController");

// protect all spending routes
router.use(ensureAuth);

// Get all expenses
router.get("/", expenseController.getAllExpenses);

// Create a new expense
router.post("/", expenseController.createExpenses);

// Update an existing expense
router.put("/:id", expenseController.updateExpenses);

// Delete an expense
router.delete("/:id", expenseController.deleteExpenses);

module.exports = router;
