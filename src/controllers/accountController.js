const db = require('../utils/db');

async function getAccount(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const account = await db.getByField('conta', 'utilizador_id', userId);
    if (!account) return res.status(404).json({ error: 'account not found' });
    return res.json(account);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAccount };