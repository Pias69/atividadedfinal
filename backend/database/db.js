import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Pool de conexões (reaproveita conexões automaticamente)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecofactory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('📦 Pool de conexões MySQL pronto para uso!');

export default db;