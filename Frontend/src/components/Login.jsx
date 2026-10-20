import { useState } from 'react'
import { api, erroresPorCampo, guardarSesion } from '../api'

// Una sola pantalla para dos cosas: entrar a un taller que ya existe, o dar de alta un taller nuevo
export default function Login({ alEntrar }) {
  const [nuevo, setNuevo] = useState(false)          // false = login, true = registrar un taller
  const [datos, setDatos] = useState({ nombreTaller: '', usuario: '', clave: '' })
  const [errores, setErrores] = useState({})

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })
  const clase = (campo) => 'form-control mb-2' + (errores[campo] ? ' is-invalid' : '')

  async function enviar(e) {
    e.preventDefault()
    try {
      const sesion = nuevo ? await api.registro(datos) : await api.login(datos.usuario, datos.clave)
      guardarSesion(sesion)
      alEntrar()
    } catch (err) {
      setErrores(erroresPorCampo(err))
      if (err.estado === 401) setErrores({ general: 'Usuario o clave incorrectos' })
    }
  }

  return (
    <div className="fondo-login">
      <form onSubmit={enviar} className="tarjeta caja-login text-center">
        <div className="icono">🔧</div>
        <h3 className="mb-0">Taller mecánico</h3>
        <p className="text-muted mb-4">{nuevo ? 'Registrá tu taller' : 'Ingresá para continuar'}</p>
        {errores.general && <div className="alert alert-danger py-2">{errores.general}</div>}

        {nuevo && (
          <>
            <input className={clase('nombreTaller')} placeholder="Nombre del taller" value={datos.nombreTaller} onChange={cambiar('nombreTaller')} />
            <div className="invalid-feedback d-block text-start">{errores.nombreTaller}</div>
          </>
        )}
        <input className={clase('usuario')} placeholder="Usuario" value={datos.usuario} onChange={cambiar('usuario')} />
        <div className="invalid-feedback d-block text-start">{errores.usuario}</div>
        <input className={clase('clave')} type="password" placeholder="Clave" value={datos.clave} onChange={cambiar('clave')} />
        <div className="invalid-feedback d-block text-start mb-2">{errores.clave}</div>

        <button className="btn btn-marca w-100">{nuevo ? 'Crear taller y entrar' : 'Entrar'}</button>
        <button type="button" className="btn btn-link btn-sm mt-2" onClick={() => { setNuevo(!nuevo); setErrores({}) }}>
          {nuevo ? '← Ya tengo un taller' : 'Registrar mi taller'}
        </button>
        {!nuevo && <p className="text-muted small mb-0">Talleres de prueba: <b>laruta</b> / laruta123 · <b>delsur</b> / delsur123</p>}
      </form>
    </div>
  )
}
