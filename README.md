📂 Organização de pastas
finance-system/

```bash
│
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── app.js
│
├── package.json
└── README.md
```

src/config/ → Contém as configurações do sistema, como conexão ao banco de dados e variáveis de ambiente.

src/controllers/ → Armazena as funções que controlam a lógica de cada rota (ex.: criação, edição, listagem).

src/models/ → Define os modelos de dados (estruturas das tabelas ou coleções do banco).

src/routes/ → Contém as rotas da API, que conectam URLs aos controladores correspondentes.

src/middleware/ → Guarda funções intermediárias, como autenticação e verificação de permissões.

src/utils/ → Funções auxiliares e ferramentas reutilizáveis (formatação, cálculos, etc.).

src/app.js → Arquivo principal da aplicação; onde o servidor e as rotas são configurados.

package.json → Define dependências e scripts do projeto.

README.md → Documento de descrição geral e instruções de uso do sistema.

---

## Como executar

### 1. Instale dependências:

```bash
npm install
```

### 2. Configure MariaDB/MySQL

Inicie o serviço MariaDB:
```bash
sudo systemctl start mariadb
```

Crie o banco de dados e tabela:
```bash
mariadb -u root -e "CREATE DATABASE IF NOT EXISTS my_database;"
mariadb -u root my_database < sql/create_tables.sql
```

Configure as variáveis de ambiente em `src/environment.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=my_database
```

### 3. Inicie a aplicação:

```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

---

## API Routes

### Base URL: `/api/users`

#### 1. **Listar todos os usuários**
- **Método:** `GET /api/users`
- **Descrição:** Retorna lista de todos os usuários (sem exibir `passwordHash`)
- **Resposta (200):**
```json
[
  {
    "id": 1,
    "username": "maky188",
    "email": "maky188@example.com",
    "createdAt": "2025-12-01T10:30:00.000Z"
  }
]
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/users
```

**JavaScript (fetch):**
```javascript
fetch('http://localhost:3000/api/users')
  .then(res => res.json())
  .then(users => console.log(users));
```

---

#### 2. **Criar novo usuário**
- **Método:** `POST /api/users`
- **Descrição:** Cria um novo usuário com validação de email e senha
- **Body (JSON):**
```json
{
  "username": "leonardo1234",
  "email": "leo1234@example.com",
  "password": "password123",
  "confirmpassword": "password123"
}
```
- **Validações:**
  - `username` obrigatório
  - `email` obrigatório e deve ser um email válido
  - `password` obrigatório, mínimo 6 caracteres
  - `confirmpassword` deve ser igual a `password`
  - `username` e `email` devem ser únicos (retorna 409 se duplicado)

- **Resposta (201):**
```json
{
  "id": 1,
  "username": "leonardo1234",
  "email": "leo1234@example.com",
  "createdAt": "2025-12-01T10:30:00.000Z"
}
```

- **Erros (400/409):**
```json
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

**Security note:** Returning `passwordHash` is sensitive. Prefer restricting this endpoint or removing `passwordHash` from responses in production.

---

## Exemplos de Uso Completo

### Exemplo 1: Criar um usuário e depois listar
```bash
# Criar usuário
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123",
    "confirmpassword": "password123"
  }'

# Listar todos os usuários
curl -X GET http://localhost:3000/api/users

# Verificar se usuário existe
curl -X GET http://localhost:3000/api/users/alice
```

### Exemplo 2: Tratamento de Erros
```bash
# Email inválido
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "email": "invalid-email",
    "password": "password123",
    "confirmpassword": "password123"
  }'
# Retorna: { "error": "invalid email" }

# Senha muito curta
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "email": "bob@example.com",
    "password": "123",
    "confirmpassword": "123"
  }'
# Retorna: { "error": "password must be at least 6 characters" }

# Usuário duplicado
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123",
    "confirmpassword": "password123"
  }'
# Retorna: { "error": "user already exists" } (409)
```

---

## Banco de Dados (MariaDB)

### Tabela `users`
```sql
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL UNIQUE,
  `email` varchar(255) NOT NULL UNIQUE,
  `passwordHash` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_users_username` (`username`),
  UNIQUE KEY `ux_users_email` (`email`)
);
```

### Variáveis de Ambiente

Configure em `src/environment.env`:
```env
DB_HOST=localhost          # Host do MariaDB
DB_USER=root               # Usuário do MariaDB
DB_PASSWORD=               # Senha (deixe em branco se usar socket auth)
DB_NAME=my_database        # Nome do banco de dados
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
mariadb -u root my_database < sql/create_tables.sql
```

### Porta 3000 já em uso
Mude a porta:
```bash
PORT=3001 npm start
```
