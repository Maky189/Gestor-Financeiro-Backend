CREATE DATABASE gestor_db;
USE gestor_db;

CREATE TABLE utilizador(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE,
    email VARCHAR(100),
    hora_de_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categorias(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome ENUM("Gastos ","Rendimento ", "Entretenimento ", ),
)

CREATE TABLE conta(
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_conta VARCHAR(30) UNIQUE,
    credito DOUBLE,
    debito DOUBLE,
    emprestimos DOUBLE,
    data DATE DEFAULT (CURRENT_DATE),
    utilizador_id INT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)
);

DELIMITER $$

CREATE TRIGGER gerar_numero_conta
BEFORE INSERT ON conta
FOR EACH ROW 
BEGIN
    SET NEW.numero_conta = CONCAT(
        "CV",
        LPAD(FLOOR(RAND()*999999999999999), 16, "0") -- gera um numero aleatorio para o numero de conta
    );
END $$

DELIMITER ;

CREATE TABLE transacao(
    id INT PRIMARY KEY AUTO_INCREMENT,
    valor DOUBLE,
    tipo ENUM("Crédito","Débito") NOT NULL, -- define o tipo da transação
    data DATE DEFAULT (CURRENT_DATE),
    conta_id INT,
    FOREIGN KEY (conta_id) REFERENCES conta(id)
);

CREATE TABLE saldo_total(
    id INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    utilizador_id INT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)
);
