const mysql = require('mysql2/promise');
const path = require('path');

const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'my_database',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

const DB_FILE = process.env.TEST_DB_FILE || process.env.DB_FILE || path.resolve(__dirname, '..', 'data', 'db.json');

module.exports = pool;
module.exports.DB_FILE = DB_FILE;
