// Middleware para checar se o usuário é admin
function ensureAdmin(req, res, next) {
  if (
    req.session &&
    req.session.user &&
    req.session.user.username === 'admin' &&
    req.session.user.isAdmin === true
  ) {
    return next();
  }
  return res.status(403).json({ error: 'admin only' });
}

module.exports = ensureAdmin;
