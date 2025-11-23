import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { MensajeriaController } from '../controllers/mensajeria.controller.js';

const router = Router();
router.use(verifyToken);

router.post('/privado', MensajeriaController.iniciarPrivado);
router.get('/', MensajeriaController.misChats);
router.post('/:id/enviar', MensajeriaController.enviar);
router.get('/:id/mensajes', MensajeriaController.historial);

export default router;