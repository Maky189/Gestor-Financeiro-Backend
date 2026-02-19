const express = require('express');
const ctrl = require('../controllers/usersController');
const { validateCreate } = require('../middleware/validateUser');
const ensureAuth = require('../middleware/ensureAuth');

const router = express.Router();

const ensureAdmin = require('../middleware/ensureAdmin');
router.get('/', ensureAuth, ensureAdmin, ctrl.list);

router.post('/login', ctrl.login);

// return current logged-in user
router.get('/me', ensureAuth, ctrl.me);

// logout (destroy session)
router.post('/logout', ensureAuth, ctrl.logout);

router.post('/', validateCreate, ctrl.create);



// DELETE user by id (admin pode deletar qualquer um, usuário só pode deletar a si mesmo)
router.delete('/:id', ensureAuth, async (req, res, next) => {
	try {
		const user = req.user || (req.session && req.session.user);
		const id = req.params.id;
		if (!user) return res.status(401).json({ error: 'unauthorized' });
		if (!user.isAdmin && String(user.id) !== String(id)) {
			return res.status(403).json({ error: 'forbidden' });
		}
		const db = require('../utils/db');
		const found = await db.getById('utilizador', id);
		if (!found) return res.status(404).json({ error: 'user not found' });

		// Remover gastos -> categorias -> contas -> usuário
		// 1. Buscar categorias do usuário
		const categorias = await db.getAll('categorias');
		const userCategorias = categorias.filter(c => String(c.utilizador_id) === String(id));
		const categoriaIds = userCategorias.map(c => c.id);

		// 2. Remover gastos dessas categorias
		if (categoriaIds.length > 0) {
			for (const catId of categoriaIds) {
				await db.remove('gastos', null, 'categoria_id', catId);
			}
		}

		// 3. Remover categorias do usuário
		for (const cat of userCategorias) {
			await db.remove('categorias', cat.id);
		}

		// 4. Remover contas do usuário
		const contas = await db.getAll('conta');
		const userContas = contas.filter(c => String(c.utilizador_id) === String(id));
		for (const conta of userContas) {
			await db.remove('conta', conta.id);
		}

		// 5. Remover usuário
		const deleted = await db.remove('utilizador', id);
		if (deleted) {
			return res.json({ ok: true, message: `User ${id} deleted` });
		}
		return res.status(500).json({ error: 'failed to delete user' });
	} catch (err) {
		next(err);
	}
});

// PATCH user by id (admin pode editar qualquer um, usuário só pode editar a si mesmo)
router.patch('/:id', ensureAuth, async (req, res, next) => {
	try {
		const user = req.user || (req.session && req.session.user);
		const id = req.params.id;
		if (!user) return res.status(401).json({ error: 'unauthorized' });
		if (!user.isAdmin && String(user.id) !== String(id)) {
			return res.status(403).json({ error: 'forbidden' });
		}
		const updates = req.body;
		// Não permitir alterar id, username, email, isAdmin
		delete updates.id;
		delete updates.username;
		delete updates.email;
		delete updates.isAdmin;
		const db = require('../utils/db');
		const updated = await db.update('utilizador', id, updates);
		if (updated) {
			return res.json({ ok: true });
		}
		return res.status(500).json({ error: 'failed to update user' });
	} catch (err) {
		next(err);
	}
});

router.put('/password', ensureAuth, ctrl.changePassword);

router.get('/transactions', ensureAuth, ctrl.transactions);

router.get('/:username', ctrl.check);

module.exports = router;