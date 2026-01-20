// Load env vars from a root .env using dotenv (best practice)
require('dotenv').config();


const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// session middleware (uses in-memory store by default — replace in production)
app.use(session({
	name: process.env.SESSION_NAME || 'connect.sid',
	secret: process.env.SESSION_SECRET || 'secret-session',
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		maxAge: 1000 * 60 * 60 // 1 hour
	}
}));

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
