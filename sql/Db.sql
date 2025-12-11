CREATE DATABASE gestor_db;
USE gestor_db;

-- Tabela de utilizadores
CREATE TABLE utilizador(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    telemovel VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    data_de_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE categorias(
    id INT PRIMARY KEY AUTO_INCREMENT,  
    nome VARCHAR(30) NOT NULL,
    utilizador_id INT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)
);

-- Tabela de contas
CREATE TABLE conta(
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_conta VARCHAR(30) UNIQUE,
    saldo_atual DOUBLE,
    emprestimos DOUBLE,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utilizador_id INT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)
);

-- Tabela de gastos
CREATE TABLE gastos(
    id INT PRIMARY KEY AUTO_INCREMENT,
    descricao VARCHAR(255) NOT NULL,
    gasto VARCHAR(30) NOT NULL,
    preco DOUBLE NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categoria_id INT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabela de chaves
CREATE TABLE chaves(
    id INT PRIMARY KEY AUTO_INCREMENT,
    chave VARCHAR(255) NOT NULL,
    gasto_id INT NOT NULL,
    conta_id INT NOT NULL,
    categoria_id INT NOT NULL,
    FOREIGN KEY (gasto_id) REFERENCES gastos(id),
    FOREIGN KEY (conta_id) REFERENCES conta(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabela de produtos por categoria
CREATE TABLE produtos(
    id INT PRIMARY KEY AUTO_INCREMENT,
    categoria_id INT NOT NULL,
    produto VARCHAR(255) NOT NULL,
    valor DOUBLE NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
