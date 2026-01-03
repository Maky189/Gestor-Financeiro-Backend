# Finance System (backend)

**Layout (important files)**

- `sql/Db.sql` — canonical database schema (creates `gestor_db` and tables like `utilizador`).
- `src/config/database.js` — MySQL/MariaDB pool configuration.
- `src/controllers/usersController.js` — user-related route handlers (register/login/me/logout).
- `src/controllers/categoriesController.js` — categories CRUD handlers.
- `src/controllers/expenseController.js` — expense (spendings) CRUD handlers.
- `src/utils/db.js` — small SQL helper used by controllers.
- `src/middleware/validateUser.js` — request validation for user creation.
- `src/middleware/ensureAuth.js` — session-based protection middleware (protects routes requiring login).

---

**Quick summary**

- The app expects a MariaDB / MySQL database. Environment variables are loaded from a `.env`. Do not commit `.env` files with secrets; 
Docker can inject variables automatically.
- The main user table (as defined in `sql/Db.sql`) is `utilizador` and stores hashed passwords in `password`.

---

## Running with Docker (Linux)

This project is distributed to run inside Docker using `docker-compose`. The `db` service will initialize the database from the `./sql` folder on first run.

1) Install Docker & Docker Compose (example for Debian/Ubuntu):

```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

2) From project root start the app:

```bash
docker compose up --build backend
```

3) Useful commands:

```bash
# show containers
docker ps

# view logs
docker-compose logs -f backend
docker-compose logs -f db

# restart services
docker-compose restart

# stop containers but keep data
docker-compose stop

# start stopped containers
docker-compose start

# stop and remove containers + named volumes (clean start)
docker-compose down -v
```

---

## Running with Docker (Windows)

1) Install Docker Desktop for Windows and start Docker Desktop.

2) Open PowerShell in the project folder and run:

```powershell
docker compose up --build backend
```

## API Quick Reference

Base path: `/api`

### Users (`/api/users`)

- `POST /api/users` — Create a new user (public). Required JSON fields:
  - `nome` (string)
  - `apelido` (string)
  - `username` (string)
  - `email` (string)
  - `morada` (string)
  - `telefone` (string)
  - `password` (string)
  - `confirmpassword` (string)

  On success this endpoint returns the created user (without the password) and sets a session cookie so the user is logged in immediately.

- `POST /api/users/login` — Login (public). Required JSON fields: **`username`** and **`password`**. On success returns the user (without password) and sets the session cookie.

- `GET /api/users/me` — Return current logged-in user (protected; requires session cookie).

- `GET /api/users` — List all users (protected; requires session cookie). Password hashes are omitted in the list response.

- `GET /api/users/:username` — Return the full user record for `username` (protected). The returned record may include the hashed password in the `password` field — use with care.

- `POST /api/users/logout` — Logout / destroy session (protected).

- `DELETE /api/users` — Delete a user by JSON body `{ "username": "..." }` (protected).

**Common errors / validation**

- 400 Bad Request: missing or invalid fields (e.g. `nome required`, `username required`, `invalid email`, `morada required`, `telefone required`, `password must be at least 6 characters`, `passwords do not match`).
- 409 Conflict: `user already exists` when `username` or `email` is duplicated.
- 401 Unauthorized: `{ "error": "unauthorized" }` when calling a protected route without a valid session.

**cURL: register & login example**

Register (creates session):

```bash
curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"Leonardo","apelido":"Dionisio","username":"leo","email":"leo@example.com","morada":"Rua X, 123","telefone":"912345678","password":"secret123","confirmpassword":"secret123"}'
```

Login (returns Set-Cookie):

```bash
curl -i -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"leo","password":"secret123"}'
```

Using cookie for subsequent requests (example with `curl` using cookie jar):

```bash
# log in and save cookie
curl -c cookiejar -X POST http://localhost:3000/api/users/login -H "Content-Type: application/json" -d '{"username":"leo","password":"secret123"}'

# use saved cookie for protected request
curl -b cookiejar http://localhost:3000/api/users/me
```

---

### Categories (`/api/categories`) — Protected

All categories routes require an authenticated session (session cookie).

- `GET /api/categories` — Get all categories for the logged-in user.
- `POST /api/categories` — Create a new category.
- `PUT /api/categories/:id` — Update an existing category.
- `DELETE /api/categories/:id` — Delete a category.


### Spendings / Expenses (`/api/spendings`) — Protected

All spendings routes require an authenticated session (session cookie).

- `GET /api/spendings` — Get all expenses for the logged-in user.
- `POST /api/spendings` — Create a new expense.
- `PUT /api/spendings/:id` — Update an existing expense.
- `DELETE /api/spendings/:id` — Delete an expense.

---

## Manual testing tips (Postman / curl)

- Registration and login set a session cookie (default name `connect.sid`). Capture that cookie and include it in requests to protected endpoints.
- Use Postman to store cookies automatically (or use `curl -c/-b cookiejar`).
- Verify `/api/users/me` returns the current session user. After `POST /api/users/logout` the session is destroyed and protected endpoints should return 401.

---

## Database (MariaDB)

### Table `utilizador`

```sql
CREATE TABLE utilizador(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    apelido VARCHAR(255) NOT NULL,
    username VARCHAR (255) NOT NULL,
    morada VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    hora_de_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Environment variables

Configure in a root `.env` file or via environment variables:

```env
DB_HOST=db
DB_USER=root
DB_PASSWORD=root
DB_NAME=gestor_db
PORT=3000
SESSION_NAME=connect.sid
SESSION_SECRET=changeme
```

---

- **Erros (400/409):**
```json
{ "error" : "name required" }
{ "error": "apelido required" }
{ "error": "username required" }
{ "error": "invalid email" }
{ "error": "password must be at least 6 characters" }
{ "error": "passwords do not match" }
{ "error": "user already exists" }
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
  "nome" : "Leonardo",
  "apelido": "Dionisio",
  "username": "leonardo1234",
  "email": "leo1234@example.com",
  "password": "password123",
  "confirmpassword": "password123"
  }'
```

**JavaScript (fetch):**
```javascript
fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Leonardo',
    apelido: 'Dionisio',
    username: 'leonardo1234',
    email: 'leo1234@example.com',
    password: 'password123',
    confirmpassword: 'password123'
  })
})
  .then(res => res.json())
  .then(user => console.log(user));
```


#### 3. **Obter usuário (inclui senha hashed)**
- **Método:** `GET /api/users/:username`
- **Descrição:** Retorna o registro completo do usuário identificado por `username` — note que isto inclui o campo `passwordHash` (hash da senha). Use com cuidado.
- **Parâmetros:**
  - `username` (string): Nome do usuário a ser procurado

- **Resposta (200 - usuário encontrado):**
```json
{
  "id": 1,
  "nome": "Kelly",
  "apelido": "Fortes",
  "username": "kelly_444",
  "email": "kelly444@example.com",
  "passwordHash": "$2a$10$...",
  "createdAt": "2025-12-01T10:30:00.000Z"
}
```

- **Resposta (404 - usuário não encontrado):**
```json
{
  "ok": false,
  "error": "Not found"
}
```

- **Erro (400 - username não informado):**
```json
{
  "error": "username required"
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/users/kelly444
```

**JavaScript (fetch):**
```javascript
fetch('http://localhost:3000/api/users/kelly444')
  .then(res => res.json())
  .then(user => console.log(user));
```

---

## Exemplos de Uso Completo

### Exemplo 1: Criar um usuário e depois listar
```bash
# Criar usuário
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "John",
    "Apelido": "Melicio",
    "username": "joao123",
    "email": "alice@example.com",
    "password": "password123",
    "confirmpassword": "password123"
  }'

# Listar todos os usuários
curl -X GET http://localhost:3000/api/users

# Verificar se usuário existe
curl -X GET http://localhost:3000/api/users/kelly444
```

### Exemplo 2: Tratamento de Erros
```bash
# Email inválido
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "John",
    "Apelido": "Melicio",
    "username": "joao",
    "email": "invalid-email",
    "password": "password123",
    "confirmpassword": "password123"
  }'
# Retorna: { "error": "invalid email" }

# Senha muito curta
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "John",
    "apelido" "Melicio",
    "username": "joao",
    "email": "joao@example.com",
    "password": "123",
    "confirmpassword": "123"
  }'
# Retorna: { "error": "password must be at least 6 characters" }

# Usuário duplicado
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Marcos",
    "apelido": "Gomes",
    "username": "maky188",
    "email": "maky188@example.com",
    "password": "password123",
    "confirmpassword": "password123"
  }'
# Retorna: { "error": "user already exists" } (409)
```

---

## Banco de Dados (MariaDB)

### Tabela `usuarios`
```sql
CREATE TABLE utilizador(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    apelido VARCHAR(255) NOT NULL,
    username VARCHAR (255) NOT NULL,
    morada VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    hora_de_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Variáveis de Ambiente

Configure in a root `.env` file or via environment variables:
```env
DB_HOST=db
DB_USER=root
DB_PASSWORD=root
DB_NAME=gestor_db
PORT=3000
```
