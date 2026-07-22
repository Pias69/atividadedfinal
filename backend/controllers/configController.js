import db from '../database/db.js';

// 🟢 GET /api/configuracoes - Buscar configurações atuais
export const obterConfiguracoes = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM configuracoes WHERE id = 1');
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Configurações não encontradas.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// 🟡 PUT /api/configuracoes - Atualizar configurações
export const atualizarConfiguracoes = async (req, res, next) => {
  try {
    const { 
      nome_empresa, 
      temp_limite_alerta, 
      notificacoes_email, 
      email_alerta, 
      modo_manutencao 
    } = req.body;

    const sql = `
      UPDATE configuracoes 
      SET 
        nome_empresa = ?, 
        temp_limite_alerta = ?, 
        notificacoes_email = ?, 
        email_alerta = ?, 
        modo_manutencao = ?
      WHERE id = 1
    `;

    await db.query(sql, [
      nome_empresa ? nome_empresa.trim() : 'EcoFactory OS',
      Number(temp_limite_alerta) || 80,
      notificacoes_email ? 1 : 0,
      email_alerta ? email_alerta.trim() : '',
      modo_manutencao ? 1 : 0
    ]);

    res.json({ mensagem: 'Configurações salvas com sucesso!' });
  } catch (error) {
    next(error);
  }
};