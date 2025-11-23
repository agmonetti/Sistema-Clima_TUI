import express from 'express';
import authRoutes from './routes/auth.routes.js';
import medicionRoutes from './routes/medicion.routes.js';
import transaccionRoutes from './routes/transaccion.routes.js';
import userRoutes from './routes/usuario.routes.js';
import cors from 'cors';
import mensajeriaRoutes from './routes/mensajeria.routes.js';

const app = express();
app.use(express.json()); //imp porque vamos a enviar json data. 
//app.js verifica que sea json

const whitelist = ['http://localhost:8080', 'http://127.0.0.1:8080'];

const corsOptions = {
  origin: function (origin, callback) {
    // !origin permite peticiones sin origen (como Postman o Server-to-Server)
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.error(`Bloqueado por CORS: ${origin}`);
      callback(new Error('Acceso denegado por política de CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // metodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true
};

// Aplicamos la configuración
app.use(cors(corsOptions));

// Rutasarreglado ese error del connection reset.
app.use('/api/mensajeria', mensajeriaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/medicion', medicionRoutes);
app.use('/api/transaccion', transaccionRoutes);
app.use('/api/usuarios', userRoutes);
app.get('/', (req, res) => res.send('API funcionando '));
export default app;