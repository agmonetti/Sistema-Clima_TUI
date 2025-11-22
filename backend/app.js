import express from 'express';
import authRoutes from './routes/auth.routes.js';
import medicionRoutes from './routes/medicion.routes.js';
import transaccionRoutes from './routes/transaccion.routes.js';
import userRoutes from './routes/usuario.routes.js';

const app = express();
app.use(express.json()); //imp porque vamos a enviar json data. 
//app.js verifica que sea json

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/medicion', medicionRoutes);
app.use('/api/transaccion', transaccionRoutes);
app.use('/api/usuarios', userRoutes);
app.get('/', (req, res) => res.send('API funcionando '));
export default app;