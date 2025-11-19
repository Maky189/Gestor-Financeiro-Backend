const express = require('express');
const ctrl = require('../controllers/usersController');

const router = express.Router();

router.get('/', ctrl.list);

router.post('/', ctrl.create);

router.delete('/:username', ctrl.remove);

router.get('/:username', ctrl.check);

module.exports = router;