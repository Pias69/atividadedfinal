import { Router } from 'express';
import { obterConfiguracoes, atualizarConfiguracoes } from '../controllers/configController.js';

const router = Router();

router.get('/', obterConfiguracoes);
router.put('/', atualizarConfiguracoes);

export default router;