const db = require("../utils/db");
const pool = require("../config/database");
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

// Transfer amount from authenticated user to another user
async function transfer(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { to_user_id, to_username, to_email, amount } = req.body || {};
    if (amount === undefined || amount === null)
      return res.status(400).json({ error: "amount is required" });

    if (!to_user_id && !to_username && !to_email)
      return res.status(400).json({ error: "recipient identifier is required" });

    const transferValue = Number(amount);
    if (!Number.isFinite(transferValue) || transferValue <= 0)
      return res.status(400).json({ error: "amount must be a positive number" });

    // find recipient user
    let recipientUser = null;
    if (to_user_id) recipientUser = await db.getByField("utilizador", "id", to_user_id);
    else if (to_username) recipientUser = await db.getByField("utilizador", "username", to_username);
    else if (to_email) recipientUser = await db.getByField("utilizador", "email", to_email);

    if (!recipientUser) return res.status(404).json({ error: "recipient not found" });
    if (String(recipientUser.id) === String(userId)) return res.status(400).json({ error: "cannot transfer to self" });

    // Test (JSON) DB path
    if (process.env.NODE_ENV === "test") {
      const senderAcct = await db.getByField(COLLECTION, "utilizador_id", userId);
      const recipientAcct = await db.getByField(COLLECTION, "utilizador_id", recipientUser.id);

      if (!senderAcct) return res.status(404).json({ error: "sender account not found" });
      if (!recipientAcct) return res.status(404).json({ error: "recipient account not found" });

      const senderBal = Number(senderAcct.saldo_atual || 0);
      if (senderBal < transferValue) return res.status(400).json({ error: "Insufficient balance" });

      const newSender = senderBal - transferValue;
      const newRecipient = Number(recipientAcct.saldo_atual || 0) + transferValue;

      await db.update(COLLECTION, senderAcct.id, { saldo_atual: newSender });
      await db.update(COLLECTION, recipientAcct.id, { saldo_atual: newRecipient });

      return res.json({ success: true, saldo_sender: newSender, saldo_recipient: newRecipient });
    }

    // SQL DB path: perform transaction with SELECT ... FOR UPDATE
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rowsSender] = await conn.query("SELECT * FROM `conta` WHERE utilizador_id = ? FOR UPDATE", [userId]);
      const [rowsRecipient] = await conn.query("SELECT * FROM `conta` WHERE utilizador_id = ? FOR UPDATE", [recipientUser.id]);

      const senderAcct = rowsSender[0];
      const recipientAcct = rowsRecipient[0];

      if (!senderAcct) {
        await conn.rollback();
        return res.status(404).json({ error: "sender account not found" });
      }
      if (!recipientAcct) {
        await conn.rollback();
        return res.status(404).json({ error: "recipient account not found" });
      }

      const senderBal = Number(senderAcct.saldo_atual || 0);
      if (senderBal < transferValue) {
        await conn.rollback();
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const newSender = senderBal - transferValue;
      const newRecipient = Number(recipientAcct.saldo_atual || 0) + transferValue;

      await conn.query("UPDATE `conta` SET saldo_atual = ? WHERE id = ?", [newSender, senderAcct.id]);
      await conn.query("UPDATE `conta` SET saldo_atual = ? WHERE id = ?", [newRecipient, recipientAcct.id]);

      await conn.commit();

      return res.json({ success: true, saldo_sender: newSender, saldo_recipient: newRecipient });
    } catch (e) {
      try {
        await conn.rollback();
      } catch (er) {}
      console.error("Transfer failed:", e);
      next(e);
    } finally {
      try {
        conn.release();
      } catch (er) {}
    }
  } catch (err) {
    console.error("Transfer error:", err);
    next(err);
  }
}

module.exports = { getAccount, getSaldo, updateAccountSaldo, transfer };
