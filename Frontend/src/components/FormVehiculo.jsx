import { useEffect, useState } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import { api, erroresPorCampo } from '../api'
import Campo from './Campo'

const COMBUSTIBLES = ['Nafta', 'Diésel', 'GNC', 'Eléctrico', 'Híbrido']

// El MISMO formulario sirve para alta y modificación: si llega "id" es edición, si no, alta.
export default function FormVehiculo({ ir, avisar, id }) {
  const [v, setV] = useState({})
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (id) api.obtener(id).then((d) => setV({ ...d, fechaCompra: d.fechaCompra?.slice(0, 10) }))
  }, [id])

  const cambiar = (campo, valor) => setV({ ...v, [campo]: valor })

  async function guardar(e) {
    e.preventDefault()
    // Los campos vacíos viajan como null para que la API los marque como obligatorios
    const datos = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === '' ? null : x]))
    if (datos.potenciaHp) datos.potenciaHp = Number(datos.potenciaHp)
    setGuardando(true)
    try {
      if (id) await api.modificar(id, datos); else await api.crear(datos)
      avisar(id ? 'Vehículo actualizado' : 'Vehículo creado')
      history.back()                                // vuelve a la pantalla anterior
    } catch (err) {
      setErrores(erroresPorCampo(err))              // la API devolvió los errores de validación
    } finally {
      setGuardando(false)
    }
  }

  const p = { valores: v, cambiar, errores }
  return (
    <form onSubmit={guardar} noValidate>
      <button type="button" className="volver" onClick={() => history.back()}><ChevronLeft size={20} /> Volver</button>
      <div className="cab-pantalla">
        <div>
          <h1>{id ? 'Editar vehículo' : 'Nuevo vehículo'}</h1>
          <p>Todos los campos son obligatorios</p>
        </div>
      </div>

      {errores.general && <div className="aviso-error">{errores.general}</div>}

      <div className="tarjeta">
        <div className="seccion-titulo">Identificación</div>
        <div className="grilla-campos">
          <Campo etiqueta="Patente" nombre="patente" {...p} />
          <Campo etiqueta="Color" nombre="color" {...p} />
          <Campo etiqueta="Marca" nombre="marca" {...p} />
          <Campo etiqueta="Modelo" nombre="modelo" {...p} />
        </div>

        <div className="seccion-titulo" style={{ marginTop: 8 }}>Detalles</div>
        <div className="grilla-campos">
          <Campo etiqueta="Combustible" nombre="combustible" opciones={COMBUSTIBLES} {...p} />
          <Campo etiqueta="Fecha de compra" nombre="fechaCompra" tipo="date" {...p} />
          <Campo etiqueta="Potencia (HP, 1 a 1000)" nombre="potenciaHp" tipo="number" modo="numeric" ancho {...p} />
        </div>

        <div className="seccion-titulo" style={{ marginTop: 8 }}>Propietario</div>
        <div className="grilla-campos">
          <Campo etiqueta="Nombre y apellido" nombre="propietario" ancho {...p} />
          <Campo etiqueta="Email" nombre="email" tipo="email" modo="email" ancho {...p} />
          <Campo etiqueta="Teléfono" nombre="telefono" tipo="tel" modo="tel" ancho {...p} />
        </div>
      </div>

      <div className="barra-acciones">
        <button type="button" className="btn btn-suave" onClick={() => history.back()}>Cancelar</button>
        <button className="btn btn-marca" disabled={guardando}><Save size={19} /> {guardando ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  )
}
