CREATE DATABASE IF NOT EXISTS gestor_db;
USE gestor_db;

CREATE TABLE IF NOT EXISTS utilizador(
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

CREATE TABLE IF NOT EXISTS categorias(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(30) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    utilizador_id INT,
    total_categoria DOUBLE DEFAULT 0.0 NOT NULL,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS conta(
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_conta VARCHAR(30) UNIQUE,
    saldo_atual DOUBLE,
    data DATE DEFAULT (CURRENT_DATE),
    utilizador_id INT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)
);


CREATE TABLE IF NOT EXISTS gastos(
    id INT PRIMARY KEY AUTO_INCREMENT,
    descricao VARCHAR(255) NOT NULL,
    nome VARCHAR(30) NOT NULL,
    preco DOUBLE NOT NULL,
    data DATE DEFAULT (CURRENT_DATE),
    categoria_id INT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);


CREATE TABLE IF NOT EXISTS chaves(
    id INT PRIMARY KEY AUTO_INCREMENT,
    chave VARCHAR(255) NOT NULL,
    gasto_id INT NOT NULL,
    conta_id INT NOT NULL,
    categoria_id INT NOT NULL,
    FOREIGN KEY (gasto_id) REFERENCES gastos(id),
    FOREIGN KEY (conta_id) REFERENCES conta(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
