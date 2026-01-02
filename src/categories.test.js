const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { expect } = require('chai');

process.env.NODE_ENV = 'test';
process.env.TEST_DB_FILE = path.resolve(__dirname, 'db.test.json');

if (fs.existsSync(process.env.TEST_DB_FILE)) {
  fs.unlinkSync(process.env.TEST_DB_FILE);
}
