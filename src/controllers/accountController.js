const pool = require("../config/database");
const db = require("../utils/db");
const COLLECTION = "conta";

// Get account details for the current logged-in user
async function getAccount(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const account = await db.getByField("conta", "utilizador_id", userId);
    if (!account) return res.status(404).json({ error: "account not found" });
    return res.json(account);
  } catch (err) {
    console.error("Failed to get account:", err);
    next(err);
  }
}

// POST account saldo_atual update
async function updateAccountSaldo(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { saldo_atual } = req.body || {};
    if (saldo_atual === undefined) {
      return res.status(400).json({ error: "saldo_atual is required" });
    }

    const newSaldo = Number(saldo_atual);
    if (!Number.isFinite(newSaldo)) {
      return res
        .status(400)
        .json({ error: "saldo_atual must be a valid number" });
    }

    if (newSaldo < 0) {
      return res.status(400).json({ error: "saldo_atual cannot be negative" });
    }

    // search user account
    const account = await db.getByField(COLLECTION, "utilizador_id", userId);
    if (!account) return res.status(404).json({ error: "account not found" });

    // update saldo_atual
    const updatedAccount = await db.update(COLLECTION, account.id, {
      saldo_atual: newSaldo,
    });
    return res.json(updatedAccount);
  } catch (err) {
    console.error("Failed to update saldo:", err);
    next(err);
  }
}

module.exports = { getAccount, updateAccountSaldo };
