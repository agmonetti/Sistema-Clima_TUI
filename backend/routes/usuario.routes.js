import { Router } from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import * as UsuarioController from '../controllers/usuario.controller.js';
const router = Router();
router.use(verifyToken);

router.delete('/me',
    verifyToken,
    UsuarioController.darseDeBaja
);

// Eliminar usuario
// 1. verifyToken: Asegura que quien llama esté logueado.
// 2. requireRole(['admin']): Asegura que SOLO un admin pase.
router.delete('/:id', 
    verifyToken, 
    requireRole(['admin']), 
    UsuarioController.deleteUser
);

// Listar todos los usuarios
// 1. verifyToken: Asegura que quien llama esté logueado.
// 2. requireRole(['admin']): Asegura que SOLO un admin pase.
router.get('/', 
    verifyToken, 
    requireRole(['admin']), 
    UsuarioController.getUsers
);

router.get('/id/:id',
    UsuarioController.buscarPorId)    
;

router.patch('/:id/revivir',
    verifyToken,
    requireRole(['admin']),
    UsuarioController.revivirUsuario
);



export default router;