import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from './middlewares/logger.js';
import maquinaRoutes from './routes/maquinaRoutes.js';
import configRoutes from './routes/configRoutes.js'; // 👈 NOVO IMPORT

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(logger);

app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
app.use('/api/maquinas', maquinaRoutes);
app.use('/api/configuracoes', configRoutes); // 👈 NOVA ROTA

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada na API." }));

app.use((err, req, res) => {
  console.error('❌ Erro Interno:', err.stack);
  res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
});

app.listen(PORT, () => console.log(`🚀 Servidor FactoryOS rodando em http://localhost:${PORT}`));