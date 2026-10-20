import { CheckCircle2, Clock, Play, ArrowRight, Wrench } from 'lucide-react'
import EstadoTrabajo from './EstadoTrabajo'
import { Vacio } from './Ui'
import { pesos } from '../api'

const ICONO = { Pendiente: <Clock size={15} />, 'En curso': <Play size={14} />, Finalizado: <CheckCircle2 size={16} /> }
const SIGUIENTE = { Pendiente: 'Pasar a En curso', 'En curso': 'Marcar Finalizado' }

// PARTIAL: una línea de tiempo de trabajos. Solo recibe datos y los dibuja.
export default function ListaTrabajos({ trabajos, avanzar }) {
  if (trabajos.length === 0) return <Vacio icono={<Wrench size={34} />} texto="Todavía no hay trabajos para este vehículo" />

  return (
    <div className="tiempo">
      {trabajos.map((t, i) => (
        <div className="hito item" key={t.id} style={{ '--i': i }}>
          <span className={`hito-punto ${t.estado.replace(' ', '-')}`}>{ICONO[t.estado]}</span>
          <div className="hito-cuerpo">
            <div className="fila">
              <div>
                <b>{t.tipoTrabajo}</b>
                <div className="suave chico">{t.descripcion}</div>
              </div>
              <span className="costo">{pesos(t.costo)}</span>
            </div>
            <div className="fila" style={{ marginTop: 10, alignItems: 'center' }}>
              <span className="suave chico">{t.mecanico} · {new Date(t.fecha).toLocaleDateString('es-AR')}</span>
              <EstadoTrabajo estado={t.estado} />
            </div>
            {t.estado !== 'Finalizado' && (
              <button className="btn btn-suave btn-chico btn-ancho" style={{ marginTop: 12 }} onClick={() => avanzar(t.id)}>
                {SIGUIENTE[t.estado]} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
