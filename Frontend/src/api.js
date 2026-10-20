// Único lugar donde el front habla con la API.
// Al entrar, la API entrega un token (la "pulsera" del login) con el nombre del usuario y de su taller.
// Se guarda en el navegador y el token se manda en cada pedido.

export const guardarSesion = (sesion) => localStorage.setItem('sesion', JSON.stringify(sesion))
export const leerSesion = () => JSON.parse(localStorage.getItem('sesion') ?? 'null')   // { token, usuario, taller }
export const borrarSesion = () => localStorage.removeItem('sesion')

// Hace un pedido a la API. Si la respuesta no es exitosa, lanza { estado, datos } para que la pantalla lo muestre.
async function pedir(metodo, url, cuerpo, conToken = true) {
  const respuesta = await fetch(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(conToken && { Authorization: `Bearer ${leerSesion()?.token}` }),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })

  if (respuesta.status === 401 && conToken) { borrarSesion(); location.reload() }   // token vencido: volver al login

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw { estado: respuesta.status, datos }
  return datos
}

export const api = {
  // Sesión (no llevan token: justamente lo entregan)
  login: (usuario, clave) => pedir('POST', '/api/autenticacion/login', { usuario, clave }, false),
  registro: (datos) => pedir('POST', '/api/autenticacion/registro', datos, false),

  // Vehículos
  listar: (patente, propietario) =>
    pedir('GET', `/api/vehiculos?patente=${encodeURIComponent(patente)}&propietario=${encodeURIComponent(propietario)}`),
  obtener: (id) => pedir('GET', `/api/vehiculos/${id}`),
  crear: (v) => pedir('POST', '/api/vehiculos', v),
  modificar: (id, v) => pedir('PUT', `/api/vehiculos/${id}`, v),
  eliminar: (id) => pedir('DELETE', `/api/vehiculos/${id}`),

  // Trabajos
  crearTrabajo: (idVehiculo, trabajo) => pedir('POST', `/api/vehiculos/${idVehiculo}/trabajos`, trabajo),
  avanzarTrabajo: (id) => pedir('POST', `/api/trabajos/${id}/avanzar`),
  tipos: () => pedir('GET', '/api/trabajos/tipos'),

  // Mecánicos
  mecanicos: () => pedir('GET', '/api/mecanicos'),
  crearMecanico: (m) => pedir('POST', '/api/mecanicos', m),
  eliminarMecanico: (id) => pedir('DELETE', `/api/mecanicos/${id}`),

  // Panel
  panel: () => pedir('GET', '/api/panel'),
}

// Convierte la respuesta 400 de la API ({ errors: { Patente: ["..."] } }) en { patente: "..." }
export function erroresPorCampo(e) {
  const mapa = {}
  for (const [campo, mensajes] of Object.entries(e?.datos?.errors ?? {})) {
    mapa[campo.charAt(0).toLowerCase() + campo.slice(1)] = mensajes[0]
  }
  if (e?.datos?.mensaje) mapa.general = e.datos.mensaje   // errores de negocio (ej. patente repetida)
  return mapa
}

export const pesos = (n) => '$ ' + Number(n ?? 0).toLocaleString('es-AR')
