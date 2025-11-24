const express = require('express');
const ctrl = require('../controllers/usersController');
const { validateCreate, validateLogin } = require('../middleware/validateUser');

const router = express.Router();

router.get('/', ctrl.list);

router.post('/login', validateLogin, ctrl.login);

router.post('/', validateCreate, ctrl.create);

router.delete('/:username', ctrl.remove);

router.get('/:username', ctrl.check);

module.exports = router;