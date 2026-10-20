import { useState } from 'react'
import { Wrench, Eye, EyeOff } from 'lucide-react'
import { api, erroresPorCampo, guardarSesion } from '../api'

// Una sola pantalla para dos cosas: entrar a un taller que ya existe, o dar de alta un taller nuevo.
export default function Login({ alEntrar }) {
  const [nuevo, setNuevo] = useState(false)          // false = login, true = registrar un taller
  const [datos, setDatos] = useState({ nombreTaller: '', usuario: '', clave: '' })
  const [errores, setErrores] = useState({})
  const [verClave, setVerClave] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })
  const clase = (campo) => 'campo' + (errores[campo] ? ' error' : '')

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    try {
      const sesion = nuevo ? await api.registro(datos) : await api.login(datos.usuario, datos.clave)
      guardarSesion(sesion)
      alEntrar()
    } catch (err) {
      setErrores(err.estado === 401 ? { general: 'Usuario o clave incorrectos' } : erroresPorCampo(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="ingreso">
      <div className="mancha m1" /><div className="mancha m2" />
      <form className="caja-ingreso" onSubmit={enviar} noValidate>
        <div className="logo"><Wrench size={30} /></div>
        <h1>Taller mecánico</h1>
        <p className="sub">{nuevo ? 'Registrá tu taller' : 'Ingresá para continuar'}</p>

        {errores.general && <div className="aviso-error">{errores.general}</div>}

        {nuevo && (
          <label className={clase('nombreTaller')}>
            <span>Nombre del taller</span>
            <input value={datos.nombreTaller} onChange={cambiar('nombreTaller')} autoComplete="organization" />
            {errores.nombreTaller && <small>{errores.nombreTaller}</small>}
          </label>
        )}
        <label className={clase('usuario')}>
          <span>Usuario</span>
          <input value={datos.usuario} onChange={cambiar('usuario')} autoComplete="username" autoCapitalize="none" />
          {errores.usuario && <small>{errores.usuario}</small>}
        </label>
        <label className={clase('clave')} style={{ position: 'relative' }}>
          <span>Clave</span>
          <input type={verClave ? 'text' : 'password'} value={datos.clave} onChange={cambiar('clave')} autoComplete={nuevo ? 'new-password' : 'current-password'} />
          <button type="button" className="icono-btn ojo" onClick={() => setVerClave(!verClave)} aria-label="Mostrar u ocultar la clave">
            {verClave ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {errores.clave && <small>{errores.clave}</small>}
        </label>

        <button className="btn btn-marca btn-ancho" disabled={enviando}>{enviando ? 'Un momento...' : nuevo ? 'Crear taller y entrar' : 'Entrar'}</button>
        <button type="button" className="enlace" onClick={() => { setNuevo(!nuevo); setErrores({}) }}>
          {nuevo ? '← Ya tengo un taller' : 'Registrar mi taller'}
        </button>

        {!nuevo && (
          <div className="rapidos">
            <button type="button" onClick={() => setDatos({ ...datos, usuario: 'laruta', clave: 'laruta123' })}>Probar: La Ruta</button>
            <button type="button" onClick={() => setDatos({ ...datos, usuario: 'delsur', clave: 'delsur123' })}>Probar: Del Sur</button>
          </div>
        )}
      </form>
    </div>
  )
}
