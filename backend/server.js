require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Pool de Conexão MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'senai',
  database: process.env.DB_NAME || 'ecofactory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const maquinasFallback = [
  { id: 1, nome: 'Prensa Hidráulica 01', setor: 'Linha de Estamparia', status: 'online', temperatura: 45, consumo: 140 },
  { id: 2, nome: 'Torno CNC Alpha', setor: 'Usinagem A', status: 'online', temperatura: 82, consumo: 210 },
  { id: 3, nome: 'Injetora Plástica B', setor: 'Moldagem', status: 'online', temperatura: 55, consumo: 180 },
  { id: 4, nome: 'Corte a Laser 03', setor: 'Chaparia', status: 'online', temperatura: 75, consumo: 300 },
  { id: 5, nome: 'Compressor Industrial', setor: 'Utilidades', status: 'offline', temperatura: 38, consumo: 90 }
];

// MÁQUINAS
app.get('/api/maquinas', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM maquinas ORDER BY id DESC');
    res.json(rows.length > 0 ? rows : maquinasFallback);
  } catch (err) {
    res.json(maquinasFallback);
  }
});

app.post('/api/maquinas', async (req, res) => {
  const { nome, setor, temperatura } = req.body;
  if (!nome || !setor) return res.status(400).json({ erro: 'Nome e setor são obrigatórios.' });

  const temp = temperatura ? parseInt(temperatura) : 45;
  const consumo = Math.floor(Math.random() * 150) + 100;

  try {
    const [result] = await db.execute(
      'INSERT INTO maquinas (nome, setor, status, temperatura, consumo) VALUES (?, ?, "online", ?, ?)',
      [nome, setor, temp, consumo]
    );
    res.status(201).json({ id: result.insertId, nome, setor, status: 'online', temperatura: temp, consumo });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar máquina.' });
  }
});

app.delete('/api/maquinas/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM maquinas WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Máquina removida com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar máquina.' });
  }
});

// AUTENTICAÇÃO E PERFIL
app.post('/api/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });

  try {
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.execute('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hash]);
    res.status(201).json({ id: result.insertId, nome, email });
  } catch (err) {
    res.status(400).json({ erro: 'E-mail já cadastrado.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ erro: 'Usuário não encontrado.' });

    const usuario = rows[0];
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(401).json({ erro: 'Senha incorreta.' });

    delete usuario.senha;
    res.json({ usuario });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao realizar login.' });
  }
});

app.get('/api/perfil/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nome, email, foto, created_at FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Perfil não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar perfil.' });
  }
});

app.post('/api/perfil/:id/foto', async (req, res) => {
  const { foto } = req.body;
  try {
    await db.execute('UPDATE usuarios SET foto = ? WHERE id = ?', [foto, req.params.id]);
    res.json({ mensagem: 'Foto atualizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar foto no banco de dados.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));