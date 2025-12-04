const express = require('express');
const users = require('./utiliador');

const router = express.Router();

router.use('/utilizador', users);

module.exports = router;
