import pool from '../config/db.js';
import { notificar } from '../utils/notificar.js';

const rolesValidos = ['usuario', 'admin', 'superadmin'];

// Todas las cuentas para el superadministrador (nunca la contraseña). esYo marca la propia:
// su rol no se puede cambiar desde aquí
export async function listarUsuarios(req, res, next) {
  try {
    const [filas] = await pool.query(
      `SELECT id, nombres, apellidos, email, nombreusuario AS nombreUsuario, rol, activo,
              fecharegistro AS fechaRegistro
       FROM usuarios
       ORDER BY fecharegistro DESC, id DESC`
    );

    const usuarios = filas.map((fila) => ({
      ...fila,
      activo: Boolean(fila.activo),
      esYo: fila.id === req.sesion.id,
    }));

    return res.json({ usuarios });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarRol(req, res, next) {
  const usuarioId = Number(req.params.id);
  const rol = req.body?.rol;

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(404).json({ message: 'No se encontró la cuenta.' });
  }

  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ campo: 'rol', message: 'Elige lector, bibliotecario o superadministrador.' });
  }

  // Así siempre queda al menos un superadministrador (quien hace el cambio)
  if (usuarioId === req.sesion.id) {
    return res.status(409).json({ message: 'No puedes cambiar el rol de tu propia cuenta.' });
  }

  let conexion;

  try {
    conexion = await pool.getConnection();
    await conexion.beginTransaction();

    const [[usuario]] = await conexion.query(
      'SELECT id, nombres, apellidos, rol FROM usuarios WHERE id = ? FOR UPDATE',
      [usuarioId]
    );

    if (!usuario) {
      await conexion.rollback();
      return res.status(404).json({ message: 'No se encontró la cuenta.' });
    }

    if (usuario.rol === rol) {
      await conexion.rollback();
      return res.json({ message: 'La cuenta ya tenía ese rol.', usuario: { id: usuario.id, rol } });
    }

    // Sin ningún bibliotecario nadie podría administrar el catálogo ni los préstamos
    if (usuario.rol === 'admin') {
      const [[{ otros }]] = await conexion.query(
        "SELECT COUNT(*) AS otros FROM usuarios WHERE rol = 'admin' AND id <> ? FOR UPDATE",
        [usuarioId]
      );

      if (Number(otros) === 0) {
        await conexion.rollback();
        return res.status(409).json({
          message: 'Es la única cuenta de bibliotecario: primero dale ese rol a otra.',
        });
      }
    }

    await conexion.query('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, usuarioId]);
    await conexion.commit();

    // La sesión de esa cuenta lee el rol de la BD en cada petición: el cambio vale de inmediato.
    // NotificacionesBiblioTK avisa y corta sus sockets para que su app la lleve a la nueva
    notificar('usuario.rolCambiado', {
      usuarioId,
      nombre: `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim(),
      rolAnterior: usuario.rol,
      rol,
    });

    return res.json({ message: 'Rol actualizado.', usuario: { id: usuarioId, rol } });
  } catch (error) {
    await conexion?.rollback().catch(() => undefined);
    return next(error);
  } finally {
    conexion?.release();
  }
}
