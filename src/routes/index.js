const express = require("express");
const users = require("./users");

const router = express.Router();

const categoryRoutes = require("./categoriesRoutes");
const spendingRoutes = require("./spendingRoutes");

router.use("/categories", categoryRoutes);
router.use("/spendings", spendingRoutes);

router.use("/users", users);

module.exports = router;
