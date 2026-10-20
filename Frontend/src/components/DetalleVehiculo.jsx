import { useEffect, useState } from 'react'
import { api, erroresPorCampo, pesos } from '../api'
import ListaTrabajos from './ListaTrabajos'

const VACIO = { tipoTrabajoId: '', mecanicoId: '', fecha: '', descripcion: '', costo: '' }

export default function DetalleVehiculo({ ir, avisar, id }) {
  const [vehiculo, setVehiculo] = useState(null)
  const [tipos, setTipos] = useState([])          // opciones del combo "tipo de trabajo"
  const [mecanicos, setMecanicos] = useState([])  // opciones del combo "mecánico"
  const [trabajo, setTrabajo] = useState(VACIO)
  const [errores, setErrores] = useState({})

  const cargar = () => api.obtener(id).then(setVehiculo)
  useEffect(() => {
    cargar()
    api.tipos().then(setTipos)
    api.mecanicos().then(setMecanicos)
  }, [id])

  // Alta del trabajo ya asociado a este vehículo (la URL lleva el id del vehículo)
  async function agregar(e) {
    e.preventDefault()
    const datos = {
      tipoTrabajoId: trabajo.tipoTrabajoId ? Number(trabajo.tipoTrabajoId) : null,
      mecanicoId: trabajo.mecanicoId ? Number(trabajo.mecanicoId) : null,
      fecha: trabajo.fecha || null,
      descripcion: trabajo.descripcion || null,
      costo: trabajo.costo ? Number(trabajo.costo) : null,
    }
    try {
      await api.crearTrabajo(id, datos)
      setTrabajo(VACIO)
      setErrores({})
      avisar('Trabajo agregado')
      cargar()
    } catch (err) {
      setErrores(erroresPorCampo(err))
    }
  }

  async function avanzar(idTrabajo) {
    try {
      const r = await api.avanzarTrabajo(idTrabajo)
      avisar(`Trabajo ahora: ${r.estado}`)
      cargar()
    } catch (err) {
      avisar(err.datos?.mensaje ?? 'No se pudo avanzar', 'error')
    }
  }

  if (!vehiculo) return null

  const trabajos = vehiculo.trabajos ?? []
  const totalInvertido = trabajos.reduce((suma, s) => suma + s.costo, 0)
  const cambiar = (nombre) => (e) => setTrabajo({ ...trabajo, [nombre]: e.target.value })
  const clase = (nombre) => 'form-control' + (errores[nombre] ? ' is-invalid' : '')

  return (
    <>
      <button className="btn btn-link px-0 mb-2" onClick={() => ir('lista')}>← Volver a vehículos</button>

      <div className="tarjeta mb-3">
        <span className="patente">{vehiculo.patente}</span>
        <h4 className="mt-2 mb-1">{vehiculo.marca} {vehiculo.modelo}</h4>
        <p className="text-muted mb-0">
          {vehiculo.color} · <span className={`etiqueta comb-${vehiculo.combustible}`}>{vehiculo.combustible}</span> · {vehiculo.potenciaHp} HP · Propietario: {vehiculo.propietario}
        </p>
      </div>

      <div className="resumen">
        <div className="dato a"><b>{trabajos.length}</b><span>Trabajos</span></div>
        <div className="dato c"><b>{trabajos.filter((s) => s.estado !== 'Finalizado').length}</b><span>Abiertos</span></div>
        <div className="dato d"><b>{pesos(totalInvertido)}</b><span>Total invertido</span></div>
      </div>

      <div className="tarjeta mb-3">
        <h5>Nuevo trabajo</h5>
        <form onSubmit={agregar} className="row g-2">
          <div className="col-md-4">
            <select className={clase('tipoTrabajoId').replace('form-control', 'form-select')} value={trabajo.tipoTrabajoId} onChange={cambiar('tipoTrabajoId')}>
              <option value="">-- Tipo de trabajo --</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <div className="invalid-feedback">{errores.tipoTrabajoId}</div>
          </div>
          <div className="col-md-4">
            <select className={clase('mecanicoId').replace('form-control', 'form-select')} value={trabajo.mecanicoId} onChange={cambiar('mecanicoId')}>
              <option value="">-- Mecánico --</option>
              {mecanicos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            <div className="invalid-feedback">{errores.mecanicoId}</div>
          </div>
          <div className="col-md-4">
            <input type="date" className={clase('fecha')} value={trabajo.fecha} onChange={cambiar('fecha')} />
            <div className="invalid-feedback">{errores.fecha}</div>
          </div>
          <div className="col-md-5">
            <input placeholder="Descripción" className={clase('descripcion')} value={trabajo.descripcion} onChange={cambiar('descripcion')} />
            <div className="invalid-feedback">{errores.descripcion}</div>
          </div>
          <div className="col-md-4">
            <input type="number" placeholder="Costo" className={clase('costo')} value={trabajo.costo} onChange={cambiar('costo')} />
            <div className="invalid-feedback">{errores.costo}</div>
          </div>
          <div className="col-md-3"><button className="btn btn-marca w-100">Agregar trabajo</button></div>
          {errores.general && <div className="text-danger small">{errores.general}</div>}
        </form>
      </div>

      <div className="tarjeta">
        <h5>Historial de trabajos</h5>
        <ListaTrabajos trabajos={trabajos} avanzar={avanzar} />
      </div>
    </>
  )
}
