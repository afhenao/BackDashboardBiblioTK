import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import routerBiblioTK from './router/routerBiblioTK.js';
import { testConnection } from './config/db.js';

const app = express();
// 3004: el 3002 lo usa PerfilBiblioTK
const puerto = Number(process.env.PORT) || 3004;

// Los fronts locales (el superadmin corre en 5175; 5145 queda por compatibilidad)
// más los que se configuren en ALLOWED_ORIGIN_* del .env, igual que en Perfil y Materiales
const allowedOrigins = [
  ...new Set([
    "http://localhost:5172",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5145",
    ...Object.entries(process.env)
      .filter(([key, value]) => key.startsWith('ALLOWED_ORIGIN_') && value)
      .map(([, origin]) => origin.trim()),
  ]),
];

app.use(express.json());
// La cookie token_acceso (la emite InicioSesionBiblioTK) la lee verificarSesion
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/DashboardBibliotk', routerBiblioTK);

// Los detalles del error se quedan en la consola: al cliente solo le llega un mensaje genérico
app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ message: 'El cuerpo de la solicitud no es un JSON válido' });
  }

  console.error('Error del servidor:', error);
  return res.status(error.status || 500).json({ message: 'Error interno del servidor' });
});

async function iniciarServidor() {
  try {
    await testConnection();
    app.listen(puerto, () => {
      console.log(`Servidor BiblioTK corriendo en el puerto ${puerto}`);
    });
  } catch {
    process.exitCode = 1;
  }
}

iniciarServidor();
