import EstadoTrabajo from './EstadoTrabajo'
import { pesos } from '../api'

// PARTIAL: un trozo de pantalla reutilizable que solo recibe datos y los dibuja
export default function ListaTrabajos({ trabajos, avanzar }) {
  if (trabajos.length === 0) return <div className="vacio"><span className="icono">🛠️</span>Sin trabajos todavía</div>

  return (
    <div className="table-responsive">
      <table className="table tabla align-middle">
        <thead><tr><th>Fecha</th><th>Trabajo</th><th>Mecánico</th><th>Estado</th><th className="text-end">Costo</th><th></th></tr></thead>
        <tbody>
          {trabajos.map((s) => (
            <tr key={s.id}>
              <td>{new Date(s.fecha).toLocaleDateString('es-AR')}</td>
              <td><b>{s.tipoTrabajo}</b><div className="small text-muted">{s.descripcion}</div></td>
              <td>{s.mecanico}</td>
              <td><EstadoTrabajo estado={s.estado} /></td>
              <td className="text-end">{pesos(s.costo)}</td>
              <td className="text-end">
                {s.estado !== 'Finalizado' && <button className="btn btn-sm btn-outline-primary" onClick={() => avanzar(s.id)}>Avanzar →</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
