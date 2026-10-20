import { useEffect, useState } from 'react'
import { ChevronLeft, Plus, Pencil, Gauge, User, Phone, Mail, Fuel } from 'lucide-react'
import { api, erroresPorCampo, pesos } from '../api'
import ListaTrabajos from './ListaTrabajos'
import Campo from './Campo'
import { Contador, Esqueleto, Hoja, Patente } from './Ui'

const VACIO = { tipoTrabajoId: '', mecanicoId: '', fecha: '', descripcion: '', costo: '' }

export default function DetalleVehiculo({ ir, avisar, id }) {
  const [vehiculo, setVehiculo] = useState(null)
  const [tipos, setTipos] = useState([])           // opciones del combo «tipo de trabajo»
  const [mecanicos, setMecanicos] = useState([])   // opciones del combo «mecánico»
  const [abierta, setAbierta] = useState(false)    // ¿está abierta la hoja «nuevo trabajo»?
  const [trabajo, setTrabajo] = useState(VACIO)
  const [errores, setErrores] = useState({})

  const cargar = () => api.obtener(id).then(setVehiculo)
  useEffect(() => {
    cargar()
    api.tipos().then(setTipos)
    api.mecanicos().then(setMecanicos)
  }, [id])

  const cambiar = (campo, valor) => setTrabajo({ ...trabajo, [campo]: valor })
  const cerrar = () => { setAbierta(false); setErrores({}); setTrabajo(VACIO) }

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
      cerrar()
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

  if (!vehiculo) return <><Esqueleto alto={170} /><div style={{ height: 14 }} /><Esqueleto alto={100} /></>

  const trabajos = vehiculo.trabajos ?? []
  const invertido = trabajos.reduce((suma, t) => suma + t.costo, 0)
  const p = { valores: trabajo, cambiar, errores }

  return (
    <>
      <button className="volver" onClick={() => history.back()}><ChevronLeft size={20} /> Vehículos</button>

      <div className="tarjeta hero">
        <div className="veh-fila">
          <Patente valor={vehiculo.patente} />
          <button className="icono-btn" style={{ color: '#fff' }} onClick={() => ir('editar', id)} aria-label="Editar vehículo"><Pencil size={19} /></button>
        </div>
        <h2>{vehiculo.marca} {vehiculo.modelo}</h2>
        <div className="meta">
          <span><Fuel size={15} />{vehiculo.combustible}</span>
          <span><Gauge size={15} />{vehiculo.potenciaHp} HP</span>
          <span>{vehiculo.color}</span>
          <span><User size={15} />{vehiculo.propietario}</span>
          <span><Phone size={15} /><a href={`tel:${vehiculo.telefono}`}>{vehiculo.telefono}</a></span>
          <span><Mail size={15} /><a href={`mailto:${vehiculo.email}`}>{vehiculo.email}</a></span>
        </div>
      </div>

      <div className="stats" style={{ marginTop: 14 }}>
        <div className="stat a" style={{ '--i': 0 }}><b><Contador valor={trabajos.length} /></b><span>Trabajos</span></div>
        <div className="stat c" style={{ '--i': 1 }}><b><Contador valor={trabajos.filter((t) => t.estado !== 'Finalizado').length} /></b><span>Abiertos</span></div>
        <div className="stat d" style={{ '--i': 2, gridColumn: 'span 2' }}><b><Contador valor={invertido} formato={pesos} /></b><span>Total invertido</span></div>
      </div>

      <h2 style={{ margin: '22px 0 14px' }}>Historial de trabajos</h2>
      <ListaTrabajos trabajos={trabajos} avanzar={avanzar} />

      <button className="fab" onClick={() => setAbierta(true)}><Plus size={22} /><span>Nuevo trabajo</span></button>

      {abierta && (
        <Hoja titulo="Nuevo trabajo" alCerrar={cerrar}>
          <form onSubmit={agregar} noValidate>
            <label className={'campo' + (errores.tipoTrabajoId ? ' error' : '')}>
              <span>Tipo de trabajo</span>
              <select value={trabajo.tipoTrabajoId} onChange={(e) => cambiar('tipoTrabajoId', e.target.value)}>
                <option value="">Elegir...</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              {errores.tipoTrabajoId && <small>{errores.tipoTrabajoId}</small>}
            </label>
            <label className={'campo' + (errores.mecanicoId ? ' error' : '')}>
              <span>Mecánico</span>
              <select value={trabajo.mecanicoId} onChange={(e) => cambiar('mecanicoId', e.target.value)}>
                <option value="">Elegir...</option>
                {mecanicos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              {errores.mecanicoId && <small>{errores.mecanicoId}</small>}
            </label>
            <Campo etiqueta="Fecha" nombre="fecha" tipo="date" {...p} />
            <Campo etiqueta="Descripción" nombre="descripcion" {...p} />
            <Campo etiqueta="Costo ($)" nombre="costo" tipo="number" modo="decimal" {...p} />
            {errores.general && <div className="aviso-error">{errores.general}</div>}
            <div className="hoja-botones">
              <button type="button" className="btn btn-suave" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-marca">Agregar</button>
            </div>
          </form>
        </Hoja>
      )}
    </>
  )
}
