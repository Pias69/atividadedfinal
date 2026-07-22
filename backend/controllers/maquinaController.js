import db from '../database/db.js';

// 🟢 GET /api/maquinas - Listar máquinas com histórico de atividades
export const listarMaquinas = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        m.id,
        m.nome,
        m.setor,
        m.status,
        m.temperatura AS temp,
        m.carga,
        DATE_FORMAT(m.criado_em, '%H:%i') AS hora,
        COALESCE(
          (SELECT mensagem FROM atividades WHERE maquina_id = m.id ORDER BY criado_em DESC, id DESC LIMIT 1),
          CASE 
            WHEN m.status = 'online' THEN 'Ativo em operação' 
            ELSE CONCAT('Modo ', m.status) 
          END
        ) AS msg
      FROM maquinas m
      ORDER BY m.id DESC
    `;

    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    next(error); // Encaminha o erro para o middleware global em server.js
  }
};

// 🟢 GET /api/maquinas/:id - Buscar máquina específica por ID
export const buscarMaquinaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        id, nome, setor, status, temperatura AS temp, carga,
        DATE_FORMAT(criado_em, '%H:%i') AS hora
      FROM maquinas 
      WHERE id = ?
    `;

    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Máquina não encontrada." });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// 🔵 POST /api/maquinas - Salvar nova máquina no MySQL
export const criarMaquina = async (req, res, next) => {
  try {
    const { nome, setor, status, temp, carga } = req.body;

    const nomeFormatado = nome.trim();
    const setorFormatado = setor ? setor.trim() : "Geral";
    const statusFormatado = status || "online";
    const tempFormatada = Number(temp) || 0;
    const cargaFormatada = Number(carga) || 0;

    // 1. Inserir a máquina
    const sqlMaquina = `
      INSERT INTO maquinas (nome, setor, status, temperatura, carga)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sqlMaquina, [
      nomeFormatado,
      setorFormatado,
      statusFormatado,
      tempFormatada,
      cargaFormatada
    ]);

    const maquinaId = result.insertId;
    const msgInicial = statusFormatado === 'online' ? 'Ativo em operação' : `Modo ${statusFormatado}`;

    // 2. Criar a primeira atividade na tabela vinculada
    const sqlAtividade = `INSERT INTO atividades (maquina_id, mensagem) VALUES (?, ?)`;
    await db.query(sqlAtividade, [maquinaId, msgInicial]);

    // Hora formatada em HH:MM
    const agora = new Date();
    const hora = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    res.status(201).json({
      id: maquinaId,
      nome: nomeFormatado,
      setor: setorFormatado,
      status: statusFormatado,
      temp: tempFormatada,
      carga: cargaFormatada,
      msg: msgInicial,
      hora
    });
  } catch (error) {
    next(error);
  }
};

// 🔴 DELETE /api/maquinas/:id - Deletar máquina do MySQL
export const deletarMaquina = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM maquinas WHERE id = ?`;

    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Máquina não encontrada para remoção." });
    }

    res.json({ mensagem: "Máquina removida com sucesso!", id: Number(id) });
  } catch (error) {
    next(error);
  }
};