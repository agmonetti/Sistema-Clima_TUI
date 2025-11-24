import { Router } from 'express';
import { registrarMedicion , listarSensores, obtenerCiudades, verHistorialSensor} from '../controllers/medicion.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js'; 

const router = Router();


router.post('/registro', registrarMedicion); // POST  /api/medicion/registro
router.get('/sensores', verifyToken, listarSensores);
router.get('/ciudades', verifyToken, obtenerCiudades);
router.get('/historial/:sensorId', verifyToken, verHistorialSensor);
export default router;