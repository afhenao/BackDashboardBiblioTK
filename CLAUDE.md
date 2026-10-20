# BackDashboardBiblioTK — Servicio de estadísticas del panel

Parte del sistema BiblioTK (ver `../CLAUDE.md`). Entrega datos agregados para el panel de administración.

- **Puerto:** 3004 (`PORT` en `.env`; el 3002 es de PerfilBiblioTK)
- **Arranque:** `npm run dev` (`node --watch src/app.js`, se recarga solo)
- **Dependencias clave:** express 5, mysql2, cookie-parser, cors, dotenv (versiones fijas, sin `^`)
- **Postman:** colección en `postman/` y `.postman/`

## Estructura

- `src/app.js` — express + `cookieParser()` + CORS con `credentials: true` + router en `/DashboardBibliotk` + middleware global de errores (mensaje genérico, sin filtrar el detalle). Arranca solo si `testConnection()` (un `SELECT 1` real) funciona.
- `src/config/db.js` — pool mysql2 y `testConnection()` real
- `src/middlewares/verificarSesion.js` — el mismo de Perfil/Materiales/Préstamos: busca la sesión de la cookie `token_acceso` en la tabla `sesiones` y pone `Cache-Control: no-store`
- `src/middlewares/verificarRol.js` — `verificarSuperadmin`: 403 si la sesión no es `superadmin`
- `src/router/routerBiblioTK.js`
- `src/controllers/dashboardController.js` — `obtenerDashboard`. Los errores se pasan con `next(error)`.

## Endpoints

| Método | Ruta | Controlador | Respuesta |
|---|---|---|---|
| GET | `/DashboardBibliotk/health` | inline | `{ message }` |
| GET | `/DashboardBibliotk/Udashboard` | `obtenerDashboard` (sesión `superadmin`) | `{ roles: { admin, usuario, superadmin } }`; sin sesión 401, otro rol 403 |

`obtenerDashboard` hace un `LEFT JOIN` de una lista fija de roles contra `usuarios`, así los roles sin usuarios devuelven 0. La usa `BiblioTK-front-superadmin/src/service/UserService.js` (con `credentials: "include"`) → página `UserDashboard.jsx`.

## Problemas conocidos

- El `README.md` está desactualizado: indica el puerto 3000 y rutas `/api/bibliotk/...` (incluida `/libros`) que no existen.
- `.env` define `JWT_SECRET`, pero ningún servicio lo usa ya (la sesión se valida contra la tabla `sesiones`).
