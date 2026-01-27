-- Db.sql - Database Schema for Gestor Financeiro

-- =============================================
-- Criação do banco de dados
-- =============================================
CREATE DATABASE IF NOT EXISTS gestor_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE gestor_db;

-- =============================================
-- Configurações de sessão
-- =============================================
SET SQL_MODE = 'STRICT_TRANS_TABLES';
SET TIME_ZONE = '+00:00';

-- =============================================
-- Tabela principal de utilizadores
-- =============================================
CREATE TABLE utilizador(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    endereco VARCHAR(255),
    telemovel VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado ENUM('ativo', 'inativo', 'suspenso') DEFAULT 'ativo',
    data_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_ultimo_login TIMESTAMP NULL,
    
    -- Índices para otimização
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de categorias
-- =============================================
CREATE TABLE categorias(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(255),
    cor VARCHAR(7) DEFAULT '#3498db', -- Código HEX para cor
    icone VARCHAR(50),
    tipo ENUM('receita', 'despesa', 'investimento', 'transferencia') NOT NULL,
    utilizador_id INT UNSIGNED NOT NULL,
    categoria_pai_id INT UNSIGNED NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (utilizador_id) 
        REFERENCES utilizador(id)
        ON DELETE CASCADE,
    FOREIGN KEY (categoria_pai_id) 
        REFERENCES categorias(id)
        ON DELETE SET NULL,
    
    -- Garantir nome único por utilizador
    UNIQUE KEY uniq_categoria_usuario (utilizador_id, nome),
    
    -- Índices
    INDEX idx_utilizador (utilizador_id),
    INDEX idx_tipo (tipo),
    INDEX idx_categoria_pai (categoria_pai_id)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de contas bancárias
-- =============================================
CREATE TABLE conta(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    numero_conta VARCHAR(50) UNIQUE,
    tipo ENUM('corrente', 'poupanca', 'investimento', 'cartao', 'outro') NOT NULL,
    instituicao VARCHAR(100),
    saldo_atual DECIMAL(15,2) DEFAULT 0.00,
    saldo_disponivel DECIMAL(15,2) DEFAULT 0.00,
    limite DECIMAL(15,2) DEFAULT 0.00,
    moeda VARCHAR(3) DEFAULT 'EUR',
    cor VARCHAR(7) DEFAULT '#2ecc71',
    incluir_saldo_total BOOLEAN DEFAULT TRUE,
    utilizador_id INT UNSIGNED NOT NULL,
    data_abertura DATE,
    data_fecho DATE NULL,
    estado ENUM('ativa', 'encerrada', 'bloqueada') DEFAULT 'ativa',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (utilizador_id) 
        REFERENCES utilizador(id)
        ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_utilizador (utilizador_id),
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    INDEX idx_data_fecho (data_fecho)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de transações (substitui 'gastos')
-- =============================================
CREATE TABLE transacao(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    tipo ENUM('despesa', 'receita', 'transferencia') NOT NULL,
    data_transacao DATE NOT NULL,
    data_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendente', 'confirmada', 'cancelada') DEFAULT 'confirmada',
    recorrente BOOLEAN DEFAULT FALSE,
    frequencia ENUM('diaria', 'semanal', 'mensal', 'anual', 'personalizada') NULL,
    proxima_ocorrencia DATE NULL,
    notas TEXT,
    categoria_id INT UNSIGNED NOT NULL,
    conta_id INT UNSIGNED NOT NULL,
    conta_destino_id INT UNSIGNED NULL, -- Para transferências
    utilizador_id INT UNSIGNED NOT NULL,
    
    -- Constraints
    FOREIGN KEY (categoria_id) 
        REFERENCES categorias(id)
        ON DELETE RESTRICT,
    FOREIGN KEY (conta_id) 
        REFERENCES conta(id)
        ON DELETE RESTRICT,
    FOREIGN KEY (conta_destino_id) 
        REFERENCES conta(id)
        ON DELETE SET NULL,
    FOREIGN KEY (utilizador_id) 
        REFERENCES utilizador(id)
        ON DELETE CASCADE,
    
    -- Check para valor positivo
    CONSTRAINT chk_valor_positivo CHECK (valor > 0),
    
    -- Check para transferências entre contas
    CONSTRAINT chk_transferencia 
        CHECK (
            (tipo = 'transferencia' AND conta_destino_id IS NOT NULL) OR
            (tipo != 'transferencia' AND conta_destino_id IS NULL)
        ),
    
    -- Índices
    INDEX idx_utilizador (utilizador_id),
    INDEX idx_conta (conta_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_data_transacao (data_transacao),
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    INDEX idx_recorrente (recorrente)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de orçamentos
-- =============================================
CREATE TABLE orcamento(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    valor_planeado DECIMAL(15,2) NOT NULL,
    valor_atual DECIMAL(15,2) DEFAULT 0.00,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    categoria_id INT UNSIGNED NOT NULL,
    utilizador_id INT UNSIGNED NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (categoria_id) 
        REFERENCES categorias(id)
        ON DELETE CASCADE,
    FOREIGN KEY (utilizador_id) 
        REFERENCES utilizador(id)
        ON DELETE CASCADE,
    
    -- Check para datas válidas
    CONSTRAINT chk_periodo_valido CHECK (periodo_inicio <= periodo_fim),
    
    -- Garantir orçamento único por categoria e período
    UNIQUE KEY uniq_orcamento_periodo (categoria_id, periodo_inicio, periodo_fim),
    
    -- Índices
    INDEX idx_utilizador (utilizador_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_periodo (periodo_inicio, periodo_fim)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de metas financeiras
-- =============================================
CREATE TABLE meta(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_meta DECIMAL(15,2) NOT NULL,
    valor_atual DECIMAL(15,2) DEFAULT 0.00,
    data_inicio DATE NOT NULL,
    data_limite DATE NOT NULL,
    tipo ENUM('economia', 'divida', 'investimento', 'compra') NOT NULL,
    prioridade ENUM('baixa', 'media', 'alta', 'urgente') DEFAULT 'media',
    estado ENUM('ativa', 'concluida', 'cancelada', 'atrasada') DEFAULT 'ativa',
    utilizador_id INT UNSIGNED NOT NULL,
    conta_id INT UNSIGNED NULL,
    categoria_id INT UNSIGNED NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (utilizador_id) 
        REFERENCES utilizador(id)
        ON DELETE CASCADE,
    FOREIGN KEY (conta_id) 
        REFERENCES conta(id)
        ON DELETE SET NULL,
    FOREIGN KEY (categoria_id) 
        REFERENCES categorias(id)
        ON DELETE SET NULL,
    
    -- Check para datas válidas
    CONSTRAINT chk_datas_meta CHECK (data_inicio <= data_limite),
    
    -- Check para valor positivo
    CONSTRAINT chk_valor_meta_positivo CHECK (valor_meta > 0),
    
    -- Índices
    INDEX idx_utilizador (utilizador_id),
    INDEX idx_estado (estado),
    INDEX idx_data_limite (data_limite),
    INDEX idx_prioridade (prioridade)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de etiquetas (tags) para transações
-- =============================================
CREATE TABLE etiqueta(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    cor VARCHAR(7) DEFAULT '#9b59b6',
    utilizador_id INT UNSIGNED NOT NULL,
    
    FOREIGN KEY (utilizador_id) 
        REFERENCES utilizador(id)
        ON DELETE CASCADE,
    
    UNIQUE KEY uniq_etiqueta_usuario (utilizador_id, nome)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de relação transação-etiqueta
-- =============================================
CREATE TABLE transacao_etiqueta(
    transacao_id INT UNSIGNED NOT NULL,
    etiqueta_id INT UNSIGNED NOT NULL,
    
    PRIMARY KEY (transacao_id, etiqueta_id),
    FOREIGN KEY (transacao_id) 
        REFERENCES transacao(id)
        ON DELETE CASCADE,
    FOREIGN KEY (etiqueta_id) 
        REFERENCES etiqueta(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Tabela de produtos/serviços recorrentes
-- =============================================
CREATE TABLE produto(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor_unitario DECIMAL(10,2) NOT NULL,
    unidade_medida VARCHAR(20),
    categoria_id INT UNSIGNED NOT NULL,
    utilizador_id INT UNSIGNED NOT NULL,
    fornecedor VARCHAR(100),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) 
        REFERENCES categorias(id)
        ON DELETE CASCADE,
    FOREIGN KEY (utilizador_id) 
        REFERENCES utilizador(id)
        ON DELETE CASCADE,
    
    UNIQUE KEY uniq_produto_usuario (utilizador_id, nome)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de logs de atividade
-- =============================================
CREATE TABLE log_atividade(
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    utilizador_id INT UNSIGNED NOT NULL,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    entidade_id INT UNSIGNED,
    detalhes JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    data_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_utilizador_data (utilizador_id, data_registo),
    INDEX idx_acao (acao),
    INDEX idx_entidade (entidade, entidade_id)
) ENGINE=InnoDB;

-- =============================================
-- Tabela de configurações do utilizador
-- =============================================
CREATE TABLE configuracao(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    utilizador_id INT UNSIGNED NOT NULL UNIQUE,
    moeda_padrao VARCHAR(3) DEFAULT 'EUR',
    formato_data VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    notificacoes_email BOOLEAN DEFAULT TRUE,
    notificacoes_push BOOLEAN DEFAULT TRUE,
    tema VARCHAR(20) DEFAULT 'claro',
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (utilizador_id) 
        REFERENCES utilizador(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Views para relatórios
-- =============================================

-- View para resumo financeiro do utilizador
CREATE VIEW view_resumo_financeiro AS
SELECT 
    u.id as utilizador_id,
    u.username,
    COUNT(DISTINCT c.id) as total_contas,
    SUM(c.saldo_atual) as saldo_total,
    COUNT(DISTINCT cat.id) as total_categorias,
    COUNT(DISTINCT t.id) as total_transacoes,
    SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END) as total_despesas,
    SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) as total_receitas,
    MAX(t.data_transacao) as ultima_transacao
FROM utilizador u
LEFT JOIN conta c ON u.id = c.utilizador_id AND c.estado = 'ativa'
LEFT JOIN categorias cat ON u.id = cat.utilizador_id
LEFT JOIN transacao t ON u.id = t.utilizador_id
GROUP BY u.id, u.username;

-- View para transações recentes
CREATE VIEW view_transacoes_recentes AS
SELECT 
    t.id,
    t.descricao,
    t.valor,
    t.tipo,
    t.data_transacao,
    t.estado,
    c.nome as categoria,
    cat.nome as conta,
    u.username
FROM transacao t
JOIN categorias c ON t.categoria_id = c.id
JOIN conta cat ON t.conta_id = cat.id
JOIN utilizador u ON t.utilizador_id = u.id
WHERE t.estado = 'confirmada'
ORDER BY t.data_transacao DESC, t.data_registo DESC;

-- =============================================
-- Triggers para manter consistência
-- =============================================

-- Trigger para atualizar saldo da conta após transação
DELIMITER $$

CREATE TRIGGER after_transacao_insert
AFTER INSERT ON transacao
FOR EACH ROW
BEGIN
    IF NEW.estado = 'confirmada' THEN
        -- Atualizar conta de origem
        UPDATE conta 
        SET saldo_atual = saldo_atual - NEW.valor
        WHERE id = NEW.conta_id AND NEW.tipo = 'despesa';
        
        UPDATE conta 
        SET saldo_atual = saldo_atual + NEW.valor
        WHERE id = NEW.conta_id AND NEW.tipo = 'receita';
        
        -- Se for transferência, atualizar conta destino
        IF NEW.tipo = 'transferencia' AND NEW.conta_destino_id IS NOT NULL THEN
            UPDATE conta 
            SET saldo_atual = saldo_atual + NEW.valor
            WHERE id = NEW.conta_destino_id;
        END IF;
        
        -- Atualizar orçamento se aplicável
        UPDATE orcamento o
        SET o.valor_atual = o.valor_atual + NEW.valor
        WHERE o.categoria_id = NEW.categoria_id 
        AND NEW.data_transacao BETWEEN o.periodo_inicio AND o.periodo_fim
        AND NEW.tipo = 'despesa';
        
        -- Registrar log
        INSERT INTO log_atividade (utilizador_id, acao, entidade, entidade_id, detalhes)
        VALUES (NEW.utilizador_id, 'CRIAR_TRANSACAO', 'transacao', NEW.id, 
                JSON_OBJECT('valor', NEW.valor, 'tipo', NEW.tipo, 'descricao', NEW.descricao));
    END IF;
END$$

CREATE TRIGGER before_transacao_delete
BEFORE DELETE ON transacao
FOR EACH ROW
BEGIN
    -- Evitar exclusão de transações confirmadas (usar cancelamento)
    IF OLD.estado = 'confirmada' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transações confirmadas não podem ser excluídas. Cancele a transação primeiro.';
    END IF;
END$$

DELIMITER ;

-- =============================================
-- Procedures úteis
-- =============================================

DELIMITER $$

-- Procedure para gerar relatório mensal
CREATE PROCEDURE sp_relatorio_mensal(IN p_utilizador_id INT, IN p_ano INT, IN p_mes INT)
BEGIN
    SELECT 
        c.nome as categoria,
        cat.tipo as tipo_categoria,
        SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END) as total_despesas,
        SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) as total_receitas,
        COUNT(t.id) as qtd_transacoes
    FROM transacao t
    JOIN categorias c ON t.categoria_id = c.id
    JOIN utilizador u ON t.utilizador_id = u.id
    WHERE u.id = p_utilizador_id
        AND YEAR(t.data_transacao) = p_ano
        AND MONTH(t.data_transacao) = p_mes
        AND t.estado = 'confirmada'
    GROUP BY c.id, c.nome, cat.tipo
    ORDER BY total_despesas DESC;
END$$

-- Procedure para atualizar saldos de todas as contas
CREATE PROCEDURE sp_atualizar_saldos(IN p_utilizador_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_conta_id INT;
    DECLARE v_saldo_calculado DECIMAL(15,2);
    DECLARE cur CURSOR FOR 
        SELECT c.id
        FROM conta c
        WHERE c.utilizador_id = p_utilizador_id AND c.estado = 'ativa';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_conta_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calcular saldo baseado em transações
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN tipo = 'receita' THEN valor
                    WHEN tipo = 'despesa' THEN -valor
                    ELSE 0
                END
            ), 0) INTO v_saldo_calculado
        FROM transacao
        WHERE conta_id = v_conta_id 
            AND estado = 'confirmada';
        
        -- Atualizar conta
        UPDATE conta 
        SET saldo_atual = v_saldo_calculado,
            data_atualizacao = CURRENT_TIMESTAMP
        WHERE id = v_conta_id;
        
    END LOOP;
    
    CLOSE cur;
END$$

DELIMITER ;

-- =============================================
-- Índices adicionais para otimização
-- =============================================

-- Índices compostos para queries comuns
CREATE INDEX idx_transacao_usuario_data ON transacao(utilizador_id, data_transacao);
CREATE INDEX idx_transacao_conta_data ON transacao(conta_id, data_transacao, tipo);
CREATE INDEX idx_transacao_categoria_data ON transacao(categoria_id, data_transacao);
CREATE INDEX idx_conta_usuario_estado ON conta(utilizador_id, estado);
CREATE INDEX idx_orcamento_usuario_periodo ON orcamento(utilizador_id, periodo_inicio, periodo_fim);

-- =============================================
-- 18. Comentários de tabelas
-- =============================================
ALTER TABLE utilizador 
    COMMENT = 'Tabela principal de utilizadores do sistema';

ALTER TABLE categorias 
    COMMENT = 'Categorias para classificação de transações';

ALTER TABLE conta 
    COMMENT = 'Contas bancárias e de investimento dos utilizadores';

ALTER TABLE transacao 
    COMMENT = 'Registro de todas as transações financeiras';

ALTER TABLE orcamento 
    COMMENT = 'Orçamentos definidos por categoria e período';

ALTER TABLE meta 
    COMMENT = 'Metas e objetivos financeiros dos utilizadores';

-- =============================================
-- Inserção de dados iniciais (opcional)
-- =============================================

-- Inserir categorias padrão para novos utilizadores
INSERT INTO categorias (nome, tipo, utilizador_id, descricao, cor) VALUES
-- Despesas
('Alimentação', 'despesa', NULL, 'Supermercado, restaurantes, lanches', '#e74c3c'),
('Transporte', 'despesa', NULL, 'Combustível, bilhetes, manutenção', '#3498db'),
('Moradia', 'despesa', NULL, 'Aluguel, hipoteca, condomínio', '#9b59b6'),
('Saúde', 'despesa', NULL, 'Consultas, medicamentos, seguro', '#2ecc71'),
('Educação', 'despesa', NULL, 'Cursos, livros, material escolar', '#f1c40f'),
('Lazer', 'despesa', NULL, 'Cinema, viagens, hobbies', '#1abc9c'),
('Vestuário', 'despesa', NULL, 'Roupas, calçados, acessórios', '#e67e22'),
('Serviços', 'despesa', NULL, 'Internet, telefone, TV', '#95a5a6'),

-- Receitas
('Salário', 'receita', NULL, 'Rendimento principal', '#27ae60'),
('Freelance', 'receita', NULL, 'Trabalhos independentes', '#2980b9'),
('Investimentos', 'receita', NULL, 'Dividendos, juros, rendimentos', '#8e44ad'),
('Presentes', 'receita', NULL, 'Dinheiro recebido como presente', '#d35400'),
('Outros', 'receita', NULL, 'Outras fontes de rendimento', '#7f8c8d');

-- =============================================
-- Filal do docmunto
-- =============================================
/*
Sistema de gestão financeira pessoal
Notas:
- Todas as tabelas usam InnoDB para suporte a transações
- Uso de UNSIGNED para IDs otimiza espaço
- UTF8MB4 suporta emojis e caracteres especiais
- Triggers garantem consistência de dados
- Views facilitam relatórios comuns
- o upgrade que foi feito foi no ambito da melhoria da rovustez da BD.
*/