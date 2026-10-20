import { Router } from 'express';
import { obtenerDashboard, } from '../controllers/dashboardController.js';
import { verificarSuperadmin } from '../middlewares/verificarRol.js';
import { verificarSesion } from '../middlewares/verificarSesion.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ message: 'Servidor BiblioTK activo' });
});

// Cuántos usuarios hay por rol: solo con una sesión de superadministrador
router.get('/Udashboard', verificarSesion, verificarSuperadmin, obtenerDashboard);

export default router;