const express = require('express');
const ctrl = require('../controllers/usersController');
const { validateCreate } = require('../middleware/validateUser');

const router = express.Router();

router.get('/', ctrl.list);

router.post('/login', ctrl.login);

// return current logged-in user
router.get('/me', ctrl.me);

// logout (destroy session)
router.post('/logout', ctrl.logout);

router.post('/', validateCreate, ctrl.create);

router.delete('/', ctrl.remove);

router.get('/:username', ctrl.check);

module.exports = router;