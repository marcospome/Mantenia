import { useEffect, useState } from 'react'
import { api, erroresPorCampo } from '../api'

const VACIO = { nombre: '', especialidad: '', telefono: '' }

export default function Mecanicos({ avisar }) {
  const [lista, setLista] = useState([])
  const [m, setM] = useState(VACIO)
  const [errores, setErrores] = useState({})

  const cargar = () => api.mecanicos().then(setLista)
  useEffect(() => { cargar() }, [])

  async function agregar(e) {
    e.preventDefault()
    const datos = Object.fromEntries(Object.entries(m).map(([k, x]) => [k, x || null]))
    try {
      await api.crearMecanico(datos)
      setM(VACIO); setErrores({})
      avisar('Mecánico agregado')
      cargar()
    } catch (err) {
      setErrores(erroresPorCampo(err))
    }
  }

  async function eliminar(x) {
    if (!confirm(`¿Eliminar a ${x.nombre}?`)) return
    try {
      await api.eliminarMecanico(x.id)
      avisar('Mecánico eliminado')
      cargar()
    } catch (err) {
      avisar(err.datos?.mensaje ?? 'No se pudo eliminar', 'error')   // 409: tiene trabajos asignados
    }
  }

  const campo = (nombre, etiqueta) => (
    <div className="col-md-3">
      <input
        placeholder={etiqueta}
        className={'form-control' + (errores[nombre] ? ' is-invalid' : '')}
        value={m[nombre]}
        onChange={(e) => setM({ ...m, [nombre]: e.target.value })}
      />
      <div className="invalid-feedback">{errores[nombre]}</div>
    </div>
  )

  return (
    <>
      <h3 className="mb-3">Mecánicos</h3>

      <div className="tarjeta mb-3">
        <h5>Nuevo mecánico</h5>
        <form onSubmit={agregar} className="row g-2">
          {campo('nombre', 'Nombre')}
          {campo('especialidad', 'Especialidad')}
          {campo('telefono', 'Teléfono')}
          <div className="col-md-3"><button className="btn btn-marca w-100">Agregar</button></div>
        </form>
      </div>

      <div className="row g-3">
        {lista.map((x) => (
          <div className="col-md-4" key={x.id}>
            <div className="tarjeta mecanico">
              <div className="avatar">{x.nombre[0]}</div>
              <div className="flex-grow-1">
                <b>{x.nombre}</b>
                <div className="small text-muted">{x.especialidad}</div>
                <div className="small">📞 {x.telefono}</div>
              </div>
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(x)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
