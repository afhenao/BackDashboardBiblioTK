import { Router } from 'express';
import { obtenerDashboard, } from '../controllers/dashboardController.js';
import { cambiarRol, listarUsuarios } from '../controllers/usuariosController.js';
import { verificarSuperadmin } from '../middlewares/verificarRol.js';
import { verificarSesion } from '../middlewares/verificarSesion.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ message: 'Servidor BiblioTK activo' });
});

// Todo lo demás es solo para una sesión de superadministrador
router.use(verificarSesion, verificarSuperadmin);

// Cuántos usuarios hay por rol
router.get('/Udashboard', obtenerDashboard);

// Todas las cuentas y el cambio de rol
router.get('/Usuarios', listarUsuarios);
router.put('/Usuarios/:id/rol', cambiarRol);

export default router;