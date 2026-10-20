import { useEffect, useState } from 'react'
import { Search, Plus, Pencil, Trash2, Gauge, User, Wrench, Car, Fuel } from 'lucide-react'
import { api } from '../api'
import { Esqueleto, Hoja, Patente, Vacio } from './Ui'

const COLORES = { rojo: '#ef4444', gris: '#9ca3af', blanco: '#f8fafc', negro: '#111827', azul: '#3b82f6', verde: '#22c55e', amarillo: '#facc15', plata: '#cbd5e1' }

export default function ListaVehiculos({ ir, avisar }) {
  const [vehiculos, setVehiculos] = useState(null)      // null = todavía cargando
  const [patente, setPatente] = useState('')            // buscador campo 1
  const [propietario, setPropietario] = useState('')    // buscador campo 2
  const [aBorrar, setABorrar] = useState(null)          // vehículo que se está por eliminar

  // Busca solo, 300 ms después de que se deja de escribir
  useEffect(() => {
    const espera = setTimeout(() => api.listar(patente, propietario).then(setVehiculos), 300)
    return () => clearTimeout(espera)
  }, [patente, propietario])

  async function eliminar() {
    await api.eliminar(aBorrar.id)
    avisar('Vehículo eliminado')
    setABorrar(null)
    api.listar(patente, propietario).then(setVehiculos)
  }

  return (
    <>
      <div className="cab-pantalla">
        <div>
          <h1>Vehículos</h1>
          <p>{vehiculos ? `${vehiculos.length} ${vehiculos.length === 1 ? 'vehículo' : 'vehículos'}` : 'Cargando...'}</p>
        </div>
      </div>

      <div className="buscador">
        <div className="buscar-campo"><Search size={19} /><input placeholder="Buscar por patente" value={patente} onChange={(e) => setPatente(e.target.value)} aria-label="Buscar por patente" /></div>
        <div className="buscar-campo"><User size={19} /><input placeholder="Buscar por propietario" value={propietario} onChange={(e) => setPropietario(e.target.value)} aria-label="Buscar por propietario" /></div>
      </div>

      {vehiculos === null && <div className="lista">{[0, 1, 2].map((i) => <Esqueleto key={i} alto={150} />)}</div>}
      {vehiculos?.length === 0 && <Vacio icono={<Car size={38} />} texto="No hay vehículos para mostrar" />}

      <div className="lista dos tres">
        {vehiculos?.map((v, i) => (
          <article className="tarjeta vehiculo item" key={v.id} style={{ '--i': i }} onClick={() => ir('detalle', v.id)}>
            <div className="veh-fila">
              <Patente valor={v.patente} />
              <span className={`chip chip-${v.combustible}`}><Fuel size={13} />{v.combustible}</span>
            </div>
            <h3>{v.marca} {v.modelo}</h3>
            <div className="meta">
              <span><i className="color-punto" style={{ '--c': COLORES[v.color?.toLowerCase()] }} />{v.color}</span>
              <span><Gauge size={15} />{v.potenciaHp} HP</span>
              <span><User size={15} />{v.propietario}</span>
            </div>
            <div className="acciones" onClick={(e) => e.stopPropagation()}>
              <button className="btn btn-suave btn-chico" onClick={() => ir('detalle', v.id)}><Wrench size={16} /> Trabajos</button>
              <button className="icono-btn" onClick={() => ir('editar', v.id)} aria-label={`Editar ${v.patente}`}><Pencil size={19} /></button>
              <button className="icono-btn peligro" onClick={() => setABorrar(v)} aria-label={`Eliminar ${v.patente}`}><Trash2 size={19} /></button>
            </div>
          </article>
        ))}
      </div>

      <button className="fab" onClick={() => ir('nuevo')}><Plus size={22} /><span>Nuevo</span></button>

      {aBorrar && (
        <Hoja titulo="¿Eliminar vehículo?" alCerrar={() => setABorrar(null)}>
          <p>Se va a eliminar <b>{aBorrar.patente}</b> junto con todos sus trabajos. Esta acción no se puede deshacer.</p>
          <div className="hoja-botones">
            <button className="btn btn-suave" onClick={() => setABorrar(null)}>Cancelar</button>
            <button className="btn btn-peligro" onClick={eliminar}>Eliminar</button>
          </div>
        </Hoja>
      )}
    </>
  )
}
