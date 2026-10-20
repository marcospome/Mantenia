import { useEffect, useState } from 'react'
import { Car, UserCog, Wrench, Banknote, Plus, ChevronRight } from 'lucide-react'
import { api, leerSesion, pesos } from '../api'
import { Contador, Esqueleto, Patente, Vacio } from './Ui'
import EstadoTrabajo from './EstadoTrabajo'

// Panel principal: todos los números salen de GET /api/panel
export default function Panel({ ir }) {
  const [r, setR] = useState(null)
  useEffect(() => { api.panel().then(setR) }, [])

  const hola = (
    <div className="cab-pantalla">
      <div>
        <h1>Hola, {leerSesion()?.usuario}</h1>
        <p>Así va tu taller hoy</p>
      </div>
    </div>
  )

  if (!r) return <>{hola}<div className="stats">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} alto={110} />)}</div><Esqueleto alto={160} /></>

  const total = r.pendientes + r.enCurso + r.finalizados
  const pct = (n) => (total ? (n / total) * 100 : 0) + '%'
  const maximo = Math.max(1, ...r.porTipo.map((t) => t.cantidad))

  const tarjetas = [
    { clase: 'a', Icono: Car, valor: r.vehiculos, texto: 'Vehículos' },
    { clase: 'b', Icono: UserCog, valor: r.mecanicos, texto: 'Mecánicos' },
    { clase: 'c', Icono: Wrench, valor: r.pendientes + r.enCurso, texto: 'Trabajos abiertos' },
    { clase: 'd', Icono: Banknote, valor: r.ingresos, texto: 'Ingresos', formato: pesos },
  ]

  return (
    <>
      {hola}
      <div className="stats">
        {tarjetas.map(({ clase, Icono, valor, texto, formato }, i) => (
          <div className={`stat ${clase}`} key={texto} style={{ '--i': i }}>
            <div className="burbuja"><Icono size={20} /></div>
            <b><Contador valor={valor} formato={formato} /></b>
            <span>{texto}</span>
          </div>
        ))}
      </div>

      <div className="tarjeta">
        <h3>Estado de los trabajos</h3>
        <div className="segmentos">
          <div className="seg-p" style={{ width: pct(r.pendientes) }} />
          <div className="seg-c" style={{ width: pct(r.enCurso) }} />
          <div className="seg-f" style={{ width: pct(r.finalizados) }} />
        </div>
        <div className="leyenda">
          <span><i style={{ background: 'var(--ambar)' }} />Pendientes {r.pendientes}</span>
          <span><i style={{ background: 'var(--azul)' }} />En curso {r.enCurso}</span>
          <span><i style={{ background: 'var(--verde)' }} />Finalizados {r.finalizados}</span>
        </div>

        <h3 style={{ marginTop: 22 }}>Trabajos por tipo</h3>
        {r.porTipo.length === 0 && <p className="suave chico" style={{ marginTop: 8 }}>Todavía no hay trabajos</p>}
        {r.porTipo.map((t) => (
          <div className="barra-fila" key={t.nombre}>
            <div><span>{t.nombre}</span><b className="num">{t.cantidad}</b></div>
            <div className="barra-fondo"><i style={{ width: (t.cantidad / maximo) * 100 + '%' }} /></div>
          </div>
        ))}
      </div>

      <div className="tarjeta">
        <h3 style={{ marginBottom: 12 }}>Últimos trabajos</h3>
        {r.ultimos.length === 0 && <Vacio icono={<Wrench size={34} />} texto="Cuando cargues trabajos van a aparecer acá" />}
        <div className="lista">
          {r.ultimos.map((u, i) => (
            <button key={i} className="item" style={{ '--i': i, textAlign: 'left' }} onClick={() => ir('detalle', u.vehiculoId)}>
              <div className="veh-fila">
                <div style={{ minWidth: 0 }}>
                  <Patente valor={u.patente} />
                  <div style={{ marginTop: 6 }}><b>{u.tipo}</b></div>
                  <div className="suave chico">{u.mecanico} · {new Date(u.fecha).toLocaleDateString('es-AR')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <EstadoTrabajo estado={u.estado} />
                  <div className="costo" style={{ marginTop: 6 }}>{pesos(u.costo)}</div>
                </div>
                <ChevronRight size={18} className="suave" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="fab" onClick={() => ir('nuevo')}><Plus size={22} /><span>Nuevo vehículo</span></button>
    </>
  )
}
