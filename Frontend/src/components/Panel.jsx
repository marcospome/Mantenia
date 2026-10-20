import { useEffect, useState } from 'react'
import { api, pesos } from '../api'
import EstadoTrabajo from './EstadoTrabajo'

// Panel principal: todos los números salen de GET /api/panel
export default function Panel({ ir }) {
  const [r, setR] = useState(null)
  useEffect(() => { api.panel().then(setR) }, [])

  if (!r) return null

  const totalTrabajos = r.pendientes + r.enCurso + r.finalizados
  const porcentaje = (n) => (totalTrabajos ? (n / totalTrabajos) * 100 : 0)
  const maximo = Math.max(1, ...r.porTipo.map((t) => t.cantidad))

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Panel del taller</h3>
          <span className="text-muted">Resumen de lo que está pasando hoy</span>
        </div>
        <button className="btn btn-marca" onClick={() => ir('nuevo')}>+ Nuevo vehículo</button>
      </div>

      <div className="resumen">
        <div className="dato a"><b>{r.vehiculos}</b><span>Vehículos</span></div>
        <div className="dato b"><b>{r.mecanicos}</b><span>Mecánicos</span></div>
        <div className="dato c"><b>{r.pendientes + r.enCurso}</b><span>Trabajos activos</span></div>
        <div className="dato d"><b>{pesos(r.ingresos)}</b><span>Ingresos (finalizados)</span></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="tarjeta h-100">
            <h5>Estado de los trabajos</h5>
            <div className="barra-estados my-3">
              <div className="e-pendiente" style={{ width: porcentaje(r.pendientes) + '%' }} />
              <div className="e-curso" style={{ width: porcentaje(r.enCurso) + '%' }} />
              <div className="e-final" style={{ width: porcentaje(r.finalizados) + '%' }} />
            </div>
            <div className="d-flex gap-3 flex-wrap">
              <EstadoTrabajo estado="Pendiente" /> {r.pendientes}
              <EstadoTrabajo estado="En curso" /> {r.enCurso}
              <EstadoTrabajo estado="Finalizado" /> {r.finalizados}
            </div>

            <h5 className="mt-4">Trabajos por tipo</h5>
            {r.porTipo.length === 0 && <div className="text-muted">Todavía no hay trabajos</div>}
            {r.porTipo.map((t) => (
              <div key={t.nombre} className="mb-2">
                <div className="d-flex justify-content-between small"><span>{t.nombre}</span><b>{t.cantidad}</b></div>
                <div className="barrita"><div style={{ width: (t.cantidad / maximo) * 100 + '%' }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="tarjeta h-100">
            <h5>Últimos trabajos</h5>
            {r.ultimos.length === 0 && <div className="vacio"><span className="icono">🛠️</span>Sin trabajos todavía</div>}
            {r.ultimos.map((u, i) => (
              <div key={i} className="ultimo" onClick={() => ir('detalle', u.vehiculoId)}>
                <div>
                  <span className="patente">{u.patente}</span> <b className="ms-1">{u.tipo}</b>
                  <div className="small text-muted">{u.mecanico} · {new Date(u.fecha).toLocaleDateString('es-AR')}</div>
                </div>
                <div className="text-end">
                  <EstadoTrabajo estado={u.estado} />
                  <div className="small mt-1">{pesos(u.costo)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
