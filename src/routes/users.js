const express = require('express');
const ctrl = require('../controllers/usersController');
const { validateCreate } = require('../middleware/validateUser');
const ensureAuth = require('../middleware/ensureAuth');

const router = express.Router();

router.get('/', ensureAuth, ctrl.list);

router.post('/login', ctrl.login);

// return current logged-in user
router.get('/me', ensureAuth, ctrl.me);

// logout (destroy session)
router.post('/logout', ensureAuth, ctrl.logout);

router.post('/', validateCreate, ctrl.create);

router.delete('/', ensureAuth, ctrl.remove);

router.put('/password', ensureAuth, ctrl.changePassword);

router.get('/transactions', ensureAuth, ctrl.transactions);

router.get('/:username', ctrl.check);

module.exports = router;