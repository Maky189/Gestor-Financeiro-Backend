const path = require('path');

// permite sobrescrever o arquivo do banco de dados para testes ou via variável de ambiente
const DB_FILE = process.env.TEST_DB_FILE || process.env.DB_FILE || path.resolve(__dirname, '..', 'data', 'db.json');

module.exports = {
	DB_FILE,
};
