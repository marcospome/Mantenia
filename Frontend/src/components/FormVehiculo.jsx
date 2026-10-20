import { useEffect, useState } from 'react'
import { api, erroresPorCampo } from '../api'
import Campo from './Campo'

const COMBUSTIBLES = ['Nafta', 'Diésel', 'GNC', 'Eléctrico', 'Híbrido']

// El MISMO formulario sirve para alta y modificación: si llega "id" es edición, si no, alta
export default function FormVehiculo({ ir, avisar, id }) {
  const [v, setV] = useState({})
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (id) api.obtener(id).then((d) => setV({ ...d, fechaCompra: d.fechaCompra?.slice(0, 10) }))
  }, [id])

  const cambiar = (campo, valor) => setV({ ...v, [campo]: valor })

  async function guardar(e) {
    e.preventDefault()
    // Los campos vacíos viajan como null para que la API los marque como obligatorios
    const datos = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === '' ? null : x]))
    if (datos.potenciaHp) datos.potenciaHp = Number(datos.potenciaHp)
    try {
      if (id) await api.modificar(id, datos); else await api.crear(datos)
      avisar(id ? "Vehículo actualizado" : "Vehículo creado")
      ir("lista")
    } catch (err) {
      setErrores(erroresPorCampo(err))   // la API devolvió los errores de validación
    }
  }

  const p = { valores: v, cambiar, errores }
  return (
    <form onSubmit={guardar} className="tarjeta">
      <h4 className="mb-1">{id ? 'Editar vehículo' : 'Nuevo vehículo'}</h4>
      <p className="text-muted">Todos los campos son obligatorios.</p>
      {errores.general && <div className="alert alert-danger">{errores.general}</div>}

      <div className="row g-3">
        <Campo etiqueta="Patente" nombre="patente" {...p} />
        <Campo etiqueta="Marca" nombre="marca" {...p} />
        <Campo etiqueta="Modelo" nombre="modelo" {...p} />
        <Campo etiqueta="Color" nombre="color" {...p} />
        <Campo etiqueta="Combustible" nombre="combustible" opciones={COMBUSTIBLES} {...p} />
        <Campo etiqueta="Fecha de compra" nombre="fechaCompra" tipo="date" {...p} />
        <Campo etiqueta="Potencia (HP, 1 a 1000)" nombre="potenciaHp" tipo="number" {...p} />
        <Campo etiqueta="Propietario" nombre="propietario" {...p} />
        <Campo etiqueta="Email" nombre="email" {...p} />
        <Campo etiqueta="Teléfono" nombre="telefono" {...p} />
      </div>

      <div className="mt-4">
        <button className="btn btn-marca me-2">Guardar</button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => ir('lista')}>Cancelar</button>
      </div>
    </form>
  )
}
