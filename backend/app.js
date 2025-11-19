import express from 'express';
import authRoutes from './routes/auth.routes.js';
import medicionRoutes from './routes/medicion.routes.js';

const app = express();
app.use(express.json()); //imp porque vamos a enviar json data. 
//app.js verifica que sea json

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/medicion', medicionRoutes);
app.get('/', (req, res) => res.send('API funcionando '));
export default app;