# Finance System (backend)


**Layout (important files)**

- `sql/Db.sql` — canonical database schema (creates `gestor_db` and tables like `utilizador`).
- `src/config/database.js` — MySQL/MariaDB pool configuration.
- `src/controllers/usersController.js` — user-related route handlers.
- `src/utils/db.js` — small SQL helper used by controllers.
- `src/middleware/validateUser.js` — request validation for user creation.

---

**Quick summary**

- The app expects a MariaDB / MySQL database. The default env file is at `src/environment.env`.
- The main user table (as defined in `sql/Db.sql`) is `utilizador` and stores hashed passwords in `password`.

---

## Setup & Run (Linux and Windows)

Step-by-step instructions for both Linux and Windows.

Prerequisites:
- Node.js (v16+ recommended) and `npm`
- MariaDB or MySQL server (instructions below)

1) Install dependencies

```bash
npm install
```

2) Create the database and import schema

Linux (Debian/Ubuntu):

```bash
# install MariaDB (Debian/Ubuntu)
sudo apt update
sudo apt install -y mariadb-server mariadb-client

# start service
sudo systemctl enable --now mariadb

# import schema (from project root)
mariadb -u root < sql/Db.sql
```

Linux (Fedora/CentOS/RHEL):

```bash
sudo dnf install -y mariadb-server mariadb
sudo systemctl enable --now mariadb
mariadb -u root < sql/Db.sql
```

Windows (using MariaDB installer or MySQL):

```powershell
mysql -u root -p < sql/Db.sql
```

If your root user has no password, omit `-p` and press Enter when prompted.

Docker (alternative, cross-platform):

```bash
# run MariaDB in a container (example)
docker run -d --name gestor-db -e MARIADB_ROOT_PASSWORD=rootpw -p 3306:3306 -v "$PWD/sql:/docker-entrypoint-initdb.d" mariadb:latest
# The SQL files in /sql will be executed automatically by the container on first run
```

3) Configure environment variables

For local development you can use `src/environment.env`. Example:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gestor_db
```

Do NOT commit `src/environment.env` with production credentials. Use real environment variables or a secrets manager in production.

4) Start the application

```bash
npm start
```

Server will be available at `http://localhost:3000` by default.

---

## API Quick Reference

Base path: `/api/users`

- `GET /api/users` — list all users (password hashes are omitted in the list).
- `GET /api/users/:username` — return the full user record (includes hashed `password`).
- `POST /api/users` — create a new user. Required JSON fields: `nome`, `apelido`, `username`, `email`, `password`, `confirmpassword`.
- `DELETE /api/users` — delete a user by JSON body `{ "username": "..." }`.

Example: create user

```bash
curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"Leonardo","apelido":"Dionisio","username":"leo","email":"leo@example.com","password":"secret123","confirmpassword":"secret123"}'
```

Example: list users

```bash
curl -i http://localhost:3000/api/users
```

```

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

---

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
    username VARCHAR(255) NOT NULL,
    apelido VARCHAR(255)NOT NULL,
    email VARCHAR(255)NOT NULL,
    password VARCHAR(255)NOT NULL,
    hora_de_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Variáveis de Ambiente

Configure em `src/environment.env`:
```env
DB_HOST=localhost          # Host do MariaDB
DB_USER=root               # Usuário do MariaDB
DB_PASSWORD=               # Senha (deixe em branco se usar socket auth)
DB_NAME=gestorDB           # Nome do banco de dados
PORT=3000                  # Porta da aplicação (opcional)
```

---

## Troubleshooting

### MariaDB não conecta
1. Verifique se o serviço está rodando:
   ```bash
   sudo systemctl status mariadb
   ```

2. Inicie o serviço:
   ```bash
   sudo systemctl start mariadb
   ```

3. Verifique as credenciais em `src/environment.env`

### Erro "Table 'users' doesn't exist"
Execute o script SQL:
```bash
mariadb -u root my_database < sql/DB.sql
```

### Porta 3000 já em uso
Mude a porta:
```bash
PORT=3001 npm start
```
