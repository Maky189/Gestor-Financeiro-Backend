async function ensureAuthenticated(req, res, next) {
  try {
    if (req.session && req.session.user) {
      // expose user on request
      req.user = req.session.user;
      return next();
    }
    return res.status(401).json({ error: 'unauthorized' });
  } catch (err) {
    next(err);
  }
}

module.exports = ensureAuthenticated;
