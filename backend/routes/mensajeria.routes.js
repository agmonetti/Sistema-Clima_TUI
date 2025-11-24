import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import * as MensajeriaController from '../controllers/mensajeria.controller.js';
const router = Router();
router.use(verifyToken);

router.post('/privado', MensajeriaController.iniciarPrivado);
router.post('/grupo', MensajeriaController.crearGrupo);
router.get('/', MensajeriaController.misChats);
router.post('/:id/enviar', MensajeriaController.enviar);
router.get('/:id/mensajes', MensajeriaController.historial);

export default router;