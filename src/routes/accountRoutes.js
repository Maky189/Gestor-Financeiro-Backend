const express = require("express");
const ensureAuth = require("../middleware/ensureAuth");
const accountController = require("../controllers/accountController");

const router = express.Router();

router.use(ensureAuth);

router.get("/", accountController.getAccount);

router.get("/saldo", accountController.getSaldo);

router.post("/saldo", accountController.updateAccountSaldo);

module.exports = router;
