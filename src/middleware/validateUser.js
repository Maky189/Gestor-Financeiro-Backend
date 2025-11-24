const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreate(req, res, next) {
  const username = req.body && req.body.username ? String(req.body.username).trim() : '';
  const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '';
  const password = req.body && req.body.password ? String(req.body.password) : '';

  if (!username) return res.status(400).json({ error: 'username required' });
  if (!email) return res.status(400).json({ error: 'email required' });
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'invalid email' });
  if (!password) return res.status(400).json({ error: 'password required' });
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

// mandar dados validados para o controller
  req.validated = { username, email, password };
  return next();
}

function validateLogin(req, res, next) {
  const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '';
  const password = req.body && req.body.password ? String(req.body.password) : '';

  if (!email) return res.status(400).json({ error: 'email required' });
  if (!password) return res.status(400).json({ error: 'password required' });

  req.validated = { email, password };
  return next();
}

module.exports = { validateCreate, validateLogin };
