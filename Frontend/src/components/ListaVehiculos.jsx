import { useEffect, useState } from 'react'
import { api } from '../api'

export default function ListaVehiculos({ ir, avisar }) {
  const [vehiculos, setVehiculos] = useState([])
  const [patente, setPatente] = useState('')          // buscador campo 1
  const [propietario, setPropietario] = useState('')  // buscador campo 2

  const cargar = () => api.listar(patente, propietario).then(setVehiculos)
  useEffect(() => { cargar() }, [])                   // al abrir la pantalla

  async function eliminar(v) {
    if (!confirm(`¿Eliminar ${v.patente}?`)) return
    await api.eliminar(v.id)
    avisar("Vehículo eliminado")
    cargar()
  }

  function limpiar() {
    setPatente(''); setPropietario('')
    api.listar('', '').then(setVehiculos)
  }

  // Cifras del resumen, calculadas con los vehículos que se están mostrando
  const potenciaPromedio = vehiculos.length
    ? Math.round(vehiculos.reduce((suma, v) => suma + v.potenciaHp, 0) / vehiculos.length)
    : 0

  return (
    <>
      <div className="resumen">
        <div className="dato a"><b>{vehiculos.length}</b><span>Vehículos</span></div>
        <div className="dato b"><b>{new Set(vehiculos.map((v) => v.propietario)).size}</b><span>Propietarios</span></div>
        <div className="dato c"><b>{potenciaPromedio} HP</b><span>Potencia promedio</span></div>
      </div>

      <div className="tarjeta">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Vehículos</h4>
          <button className="btn btn-marca" onClick={() => ir('nuevo')}>+ Nuevo vehículo</button>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-4"><input className="form-control" placeholder="🔍 Buscar por patente" value={patente} onChange={(e) => setPatente(e.target.value)} /></div>
          <div className="col-md-4"><input className="form-control" placeholder="🔍 Buscar por propietario" value={propietario} onChange={(e) => setPropietario(e.target.value)} /></div>
          <div className="col-md-4">
            <button className="btn btn-marca me-2" onClick={cargar}>Buscar</button>
            <button className="btn btn-outline-secondary" onClick={limpiar}>Limpiar</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table tabla align-middle">
            <thead><tr><th>Patente</th><th>Vehículo</th><th>Combustible</th><th>HP</th><th>Propietario</th><th></th></tr></thead>
            <tbody>
              {vehiculos.map((v) => (
                <tr key={v.id}>
                  <td><span className="patente">{v.patente}</span></td>
                  <td>{v.marca} {v.modelo} <span className="text-muted">· {v.color}</span></td>
                  <td><span className={`etiqueta comb-${v.combustible}`}>{v.combustible}</span></td>
                  <td>{v.potenciaHp}</td>
                  <td>{v.propietario}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => ir('detalle', v.id)}>Trabajos</button>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => ir('editar', v.id)}>Editar</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(v)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehiculos.length === 0 && <div className="vacio"><span className="icono">🚗</span>No hay vehículos para mostrar</div>}
        </div>
      </div>
    </>
  )
}
