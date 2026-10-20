import { useEffect, useState } from 'react'
import { Plus, Trash2, Phone, UserCog } from 'lucide-react'
import { api, erroresPorCampo } from '../api'
import Campo from './Campo'
import { Esqueleto, Hoja, Vacio } from './Ui'

const VACIO = { nombre: '', especialidad: '', telefono: '' }

export default function Mecanicos({ avisar }) {
  const [lista, setLista] = useState(null)
  const [abierta, setAbierta] = useState(false)     // ¿está abierta la hoja «nuevo mecánico»?
  const [m, setM] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [aBorrar, setABorrar] = useState(null)

  const cargar = () => api.mecanicos().then(setLista)
  useEffect(() => { cargar() }, [])

  const cerrar = () => { setAbierta(false); setM(VACIO); setErrores({}) }

  async function agregar(e) {
    e.preventDefault()
    const datos = Object.fromEntries(Object.entries(m).map(([k, x]) => [k, x || null]))
    try {
      await api.crearMecanico(datos)
      cerrar()
      avisar('Mecánico agregado')
      cargar()
    } catch (err) {
      setErrores(erroresPorCampo(err))
    }
  }

  async function eliminar() {
    try {
      await api.eliminarMecanico(aBorrar.id)
      avisar('Mecánico eliminado')
      cargar()
    } catch (err) {
      avisar(err.datos?.mensaje ?? 'No se pudo eliminar', 'error')   // 409: tiene trabajos asignados
    }
    setABorrar(null)
  }

  const p = { valores: m, cambiar: (campo, valor) => setM({ ...m, [campo]: valor }), errores }

  return (
    <>
      <div className="cab-pantalla">
        <div>
          <h1>Mecánicos</h1>
          <p>{lista ? `${lista.length} en tu taller` : 'Cargando...'}</p>
        </div>
      </div>

      {lista === null && <div className="lista">{[0, 1, 2].map((i) => <Esqueleto key={i} alto={84} />)}</div>}
      {lista?.length === 0 && <Vacio icono={<UserCog size={38} />} texto="Todavía no cargaste mecánicos" />}

      <div className="lista dos tres">
        {lista?.map((x, i) => (
          <div className="tarjeta mecanico item" key={x.id} style={{ '--i': i }}>
            <div className="avatar">{x.nombre[0]}</div>
            <div className="info">
              <b>{x.nombre}</b>
              <span className="suave chico">{x.especialidad}</span>
              <a href={`tel:${x.telefono}`}><Phone size={13} style={{ verticalAlign: -1 }} /> {x.telefono}</a>
            </div>
            <button className="icono-btn peligro" onClick={() => setABorrar(x)} aria-label={`Eliminar a ${x.nombre}`}><Trash2 size={19} /></button>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => setAbierta(true)}><Plus size={22} /><span>Nuevo</span></button>

      {abierta && (
        <Hoja titulo="Nuevo mecánico" alCerrar={cerrar}>
          <form onSubmit={agregar} noValidate>
            <Campo etiqueta="Nombre y apellido" nombre="nombre" {...p} />
            <Campo etiqueta="Especialidad" nombre="especialidad" {...p} />
            <Campo etiqueta="Teléfono" nombre="telefono" tipo="tel" modo="tel" {...p} />
            <div className="hoja-botones">
              <button type="button" className="btn btn-suave" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-marca">Agregar</button>
            </div>
          </form>
        </Hoja>
      )}

      {aBorrar && (
        <Hoja titulo="¿Eliminar mecánico?" alCerrar={() => setABorrar(null)}>
          <p>Vas a eliminar a <b>{aBorrar.nombre}</b>. Si tiene trabajos asignados, no se va a poder.</p>
          <div className="hoja-botones">
            <button className="btn btn-suave" onClick={() => setABorrar(null)}>Cancelar</button>
            <button className="btn btn-peligro" onClick={eliminar}>Eliminar</button>
          </div>
        </Hoja>
      )}
    </>
  )
}
