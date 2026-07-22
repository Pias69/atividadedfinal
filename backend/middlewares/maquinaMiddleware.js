export const validarMaquina = (req, res, next) => {
  const { nome } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ 
      erro: "Validação falhou: O campo 'nome' é obrigatório e deve ser um texto válido." 
    });
  }

  next();
};