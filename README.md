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