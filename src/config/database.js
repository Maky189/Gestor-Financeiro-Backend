const mysql = require("mysql2/promise");
const path = require("path");

if (process.env.NODE_ENV === 'test') {
  // in test mode we'll use a JSON file DB — path can be set with TEST_DB_FILE
  const DB_FILE = process.env.TEST_DB_FILE || path.resolve(__dirname, '..', 'db.test.json');
  module.exports = { DB_FILE };
} else {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gestor_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  module.exports = pool;
}
