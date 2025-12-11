// Load simple key=value env file (if present) so local `src/environment.env` works without extra deps
const fs = require('fs');
const path = require('path');
const envFile = path.resolve(__dirname, 'environment.env');
if (fs.existsSync(envFile)) {
	const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const idx = trimmed.indexOf('=');
		if (idx === -1) continue;
		const key = trimmed.slice(0, idx).trim();
		const val = trimmed.slice(idx + 1).trim();
		if (!(key in process.env)) process.env[key] = val;
	}
}

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api', routes);

// qual o env esta a usar
app.get('/', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
	app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
