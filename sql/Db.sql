CREATE DATABASE gestor_db;
USE gestor_db;

CREATE TABLE utilizador(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    apelido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    hora_de_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias(
    id INT PRIMARY KEY AUTO_INCREMENT,  
    nome VARCHAR(30) NOT NULL,
    utilizador_id INT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)
);

CREATE TABLE conta(
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_conta VARCHAR(30) UNIQUE,
    saldo_atual DOUBLE,
    emprestimos DOUBLE,
    data DATE DEFAULT (CURRENT_DATE),
    utilizador_id INT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)
);

CREATE TABLE gastos(
    id INT PRIMARY KEY AUTO_INCREMENT,
    descricao VARCHAR(255) NOT NULL,
    gasto VARCHAR(30) NOT NULL,
    preco DOUBLE NOT NULL,
    data DATE DEFAULT (CURRENT_DATE),
    categoria_id INT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE chaves(
    id INT PRIMARY KEY AUTO_INCREMENT,
    chave VARCHAR(255) NOT NULL,
    gasto_id INT NOT NULL,
    FOREIGN KEY (gasto_id) REFERENCES gastos(id),
    conta_id INT NOT NOT,
    FOREIGN KEY (conta_id) REFERENCES conta(id),
    categoria_id INT NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES (categorias)
);
