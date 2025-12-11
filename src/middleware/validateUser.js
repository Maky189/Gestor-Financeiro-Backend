const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreate(req, res, next) {
  const username = req.body && req.body.username ? String(req.body.username).trim() : '';
  const nome = req.body && req.body.nome ? String(req.body.nome).trim() : '';
  const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '';
  const apelido = req.body && req.body.apelido ? String(req.body.apelido).trim() : '';
  const password = req.body && req.body.password ? String(req.body.password) : '';
  const confirmpassword = req.body && req.body.confirmpassword ? String(req.body.confirmpassword) : '';

  if (!nome) return res.status(400).json({ error: 'nome required' });
  if (!apelido) return res.status(400).json({ error: 'apelido required' });
  if (!username) return res.status(400).json({ error: 'username required' });
  if (!email) return res.status(400).json({ error: 'email required' });
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'invalid email' });
  if (!password) return res.status(400).json({ error: 'password required' });
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });
  if (!confirmpassword) return res.status(400).json({ error: 'diferent passwords' });
  if (password !== confirmpassword) {
      return res.status(400).json({ error: 'passwords do not match' });
    }
// mandar dados validados para o controller
  req.validated = { nome, apelido, username, email, password, confirmpassword };
  return next();
}

module.exports = {validateCreate};
