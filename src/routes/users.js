const express = require('express');
const ctrl = require('../controllers/usersController');
const { validateCreate } = require('../middleware/validateUser');

const router = express.Router();

router.get('/', ctrl.list);

//router.post('/login', ctrl.create);

router.post('/', validateCreate, ctrl.create);

router.delete('/', ctrl.remove);

router.get('/:username', ctrl.check);

module.exports = router;