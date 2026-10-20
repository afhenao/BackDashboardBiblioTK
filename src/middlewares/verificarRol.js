// Va después de verificarSesion: las estadísticas de usuarios son solo del superadministrador
export function verificarSuperadmin(req, res, next) {
  if (req.sesion?.rol !== "superadmin") {
    return res.status(403).json({
      message: "Solo el superadministrador puede ver las estadísticas de usuarios.",
    });
  }

  return next();
}
