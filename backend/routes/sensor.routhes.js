import { Router } from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import * as SensorController from '../controllers/sensor.controller.js';

const router = Router();

// 1. CASO: USUARIO COMÚN
router.get('/', 
    verifyToken, 
    requireRole(['usuario', 'tecnico', 'admin']), // Todos entran
    SensorController.getAllSensors
);

// El técnico puede CREAR o MODIFICAR. El usuario NO. El Admin SÍ.
router.post('/', 
    verifyToken, 
    requireRole(['tecnico', 'admin']), // Usuario queda fuera
    SensorController.createSensor
);

router.put('/:id', 
    verifyToken, 
    requireRole(['tecnico', 'admin']), 
    SensorController.updateSensor
);

// borrar un sensor es crítico solo lo hace el Admin.
router.delete('/:id', 
    verifyToken, 
    requireRole(['admin']), // Solo admin
    SensorController.deleteSensor
);

export default router;