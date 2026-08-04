require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES E ARQUIVOS ESTÁTICOS
// ==========================================
app.use(cors());
app.use(express.json());

// Aponta para a pasta 'frontend' que está no mesmo nível da pasta 'backend'
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ==========================================
// CONEXÃO COM O BANCO DE DADOS (MYSQL)
// ==========================================
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'senai', // Altere se a sua senha do MySQL for diferente
  database: process.env.DB_NAME || 'ecofactory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Dados de emergência caso o MySQL falhe
const maquinasFallback = [
  { id: 1, nome: 'Prensa Hidráulica 01', setor: 'Linha de Estamparia', status: 'online', temperatura: 45, carga: 80, tipo: 'Prensa', consumo: 140 },
  { id: 2, nome: 'Torno CNC Alpha', setor: 'Usinagem A', status: 'online', temperatura: 82, carga: 95, tipo: 'Torno', consumo: 210 },
  { id: 3, nome: 'Injetora Plástica B', setor: 'Moldagem', status: 'online', temperatura: 55, carga: 60, tipo: 'Injetora', consumo: 180 },
  { id: 4, nome: 'Corte a Laser 03', setor: 'Chaparia', status: 'online', temperatura: 75, carga: 85, tipo: 'Laser', consumo: 300 },
  { id: 5, nome: 'Compressor Industrial', setor: 'Utilidades', status: 'offline', temperatura: 38, carga: 0, tipo: 'Compressor', consumo: 90 }
];

// ==========================================
// INICIALIZAÇÃO E AUTO-CONFIGURAÇÃO DO DB
// ==========================================
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('⚡ Conectado ao MySQL (ecofactory_db) com sucesso!');
    
    // Garante que a tabela de usuários exista
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Popula a tabela 'maquinas' caso esteja vazia
    const [rows] = await connection.query('SELECT COUNT(*) as total FROM maquinas');
    if (rows[0].total === 0) {
      console.log('🌱 Inserindo máquinas iniciais na base de dados...');
      await connection.query(`
        INSERT INTO maquinas (nome, setor, status, temperatura, carga, tipo, consumo) VALUES
        ('Prensa Hidráulica 01', 'Linha de Estamparia', 'online', 45, 80, 'Prensa', 140),
        ('Torno CNC Alpha', 'Usinagem A', 'online', 82, 95, 'Torno', 210),
        ('Injetora Plástica B', 'Moldagem', 'online', 55, 60, 'Injetora', 180),
        ('Corte a Laser 03', 'Chaparia', 'online', 75, 85, 'Laser', 300),
        ('Compressor Industrial', 'Utilidades', 'offline', 38, 0, 'Compressor', 90)
      `);
      console.log('✅ Máquinas iniciais cadastradas!');
    }

    connection.release();
  } catch (err) {
    console.error('⚠️ Erro ao inicializar conexão com o MySQL:', err.message);
  }
})();

// ==========================================
// ROTAS DE MÁQUINAS
// ==========================================

// Buscar todas as máquinas
app.get('/api/maquinas', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM maquinas ORDER BY id DESC');
    if (rows.length === 0) {
      return res.json(maquinasFallback);
    }
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar máquinas no MySQL. Retornando lista reserva.', err.message);
    res.json(maquinasFallback);
  }
});

// Cadastrar nova máquina
app.post('/api/maquinas', async (req, res) => {
  const { nome, setor, temperatura, tipo } = req.body;
  if (!nome || !setor) {
    return res.status(400).json({ erro: 'Nome e setor são obrigatórios.' });
  }

  const temp = temperatura ? parseInt(temperatura) : 45;
  const consumo = Math.floor(Math.random() * 150) + 100;
  const carga = 75;
  const tipoMaquina = tipo || 'Geral';

  try {
    const [result] = await db.execute(
      'INSERT INTO maquinas (nome, setor, status, temperatura, carga, tipo, consumo) VALUES (?, ?, "online", ?, ?, ?, ?)',
      [nome, setor, temp, carga, tipoMaquina, consumo]
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      setor,
      status: 'online',
      temperatura: temp,
      carga,
      tipo: tipoMaquina,
      consumo
    });
  } catch (err) {
    console.error('Erro ao inserir máquina:', err);
    res.status(500).json({ erro: 'Erro ao adicionar máquina no MySQL.' });
  }
});

// Excluir máquina pelo ID
app.delete('/api/maquinas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM maquinas WHERE id = ?', [id]);
    res.json({ mensagem: `Máquina #${id} excluída com sucesso.` });
  } catch (err) {
    console.error('Erro ao deletar máquina:', err);
    res.status(500).json({ erro: 'Não foi possível deletar a máquina.' });
  }
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO (CADASTRO E LOGIN)
// ==========================================

// Cadastro de usuário
app.post('/api/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const [result] = await db.execute(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );

    res.status(201).json({ mensagem: 'Usuário cadastrado!', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ erro: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ erro: 'Erro interno ao realizar cadastro.' });
  }
});

// Login de usuário
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe o e-mail e a senha.' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    delete usuario.senha;
    res.json({ mensagem: 'Login efetuado com sucesso!', usuario });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao efetuar login.' });
  }
});

// Perfil do usuário
app.get('/api/perfil/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nome, email, created_at FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar perfil.' });
  }
});

// ==========================================
// ROTA FALLBACK PARA O FRONTEND (SPA)
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});