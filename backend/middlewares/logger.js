export const logger = (req, res, next) => {
  const hora = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${hora}] 📡 ${req.method} -> ${req.url}`);
  next();
};