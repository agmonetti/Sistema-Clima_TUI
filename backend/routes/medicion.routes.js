import { Router } from 'express';
import { registrarMedicion } from '../controllers/medicion.controller.js';


const router = Router();


router.post('/registro', registrarMedicion); // POST  /api/medicion/registro

export default router;