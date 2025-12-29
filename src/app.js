// Load env vars from a root .env using dotenv (best practice)
require('dotenv').config();


const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development', api: true }));

app.use('/api', routes);

// qual o env esta a usar
app.get('/', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
	app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
