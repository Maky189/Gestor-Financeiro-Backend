const db = require("../utils/db");
const COLLECTION = "conta";

// Get account details for the current logged-in user
async function getAccount(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const account = await db.getByField(COLLECTION, "utilizador_id", userId);
    if (!account) return res.status(404).json({ error: "account not found" });
    return res.json(account);
  } catch (err) {
    console.error("Failed to get account:", err);
    next(err);
  }
}

// Get saldo_atual update for the current logged-in user
async function getSaldo(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const account = await db.getByField(COLLECTION, "utilizador_id", userId);
    if (!account) return res.status(404).json({ error: "account not found" });

    return res.json({ saldo_atual: Number(account.saldo_atual) || 0 });
  } catch (err) {
    console.error("Failed to get saldo:", err);
    next(err);
  }
}

// POST account saldo_atual update
async function updateAccountSaldo(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { amount } = req.body || {};
    if (amount === undefined) {
      return res.status(400).json({ error: "amount is required" });
    }

    const depositValue = Number(amount);
    if (!Number.isFinite(depositValue) || depositValue <= 0) {
      return res
        .status(400)
        .json({ error: "amount must be a possitive number" });
    }

    const account = await db.getByField(COLLECTION, "utilizador_id", userId);
    if (!account) {
      return res.status(404).json({ error: "account not found" });
    }

    const correntSaldo = Number(account.saldo_atual) || 0;
    const newSaldo = correntSaldo + depositValue;

    const updatedAccount = await db.update(COLLECTION, account.id, {
      saldo_atual: newSaldo,
    });

    return res.json({ saldo_atual: updatedAccount.saldo_atual });
  } catch (err) {
    console.error("Failed to update account:", err);
    next(err);
  }
}

module.exports = { getAccount, getSaldo, updateAccountSaldo };
