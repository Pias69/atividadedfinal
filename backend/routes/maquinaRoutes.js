import { Router } from 'express';
import { 
  listarMaquinas, 
  buscarMaquinaPorId, 
  criarMaquina, 
  deletarMaquina 
} from '../controllers/maquinaController.js';
import { validarMaquina } from '../middlewares/maquinaMiddleware.js';

const router = Router();

router.get('/', listarMaquinas);
router.get('/:id', buscarMaquinaPorId);
router.post('/', validarMaquina, criarMaquina);
router.delete('/:id', deletarMaquina);

export default router;