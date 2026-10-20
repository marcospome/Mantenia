import { useState } from 'react'
import { leerSesion } from './api'
import Login from './components/Login'
import Layout from './components/Layout'
import Panel from './components/Panel'
import ListaVehiculos from './components/ListaVehiculos'
import FormVehiculo from './components/FormVehiculo'
import DetalleVehiculo from './components/DetalleVehiculo'
import Mecanicos from './components/Mecanicos'

// Sin librería de rutas: "pantalla" dice qué se muestra y "id" a qué vehículo se refiere
export default function App() {
  const [logueado, setLogueado] = useState(!!leerSesion())
  const [pantalla, setPantalla] = useState('panel')   // panel | lista | nuevo | editar | detalle | mecanicos
  const [id, setId] = useState(null)
  const [aviso, setAviso] = useState(null)            // mensaje flotante { texto, tipo }

  if (!logueado) return <Login alEntrar={() => setLogueado(true)} />

  const ir = (p, idVehiculo = null) => { setPantalla(p); setId(idVehiculo) }
  const avisar = (texto, tipo = 'ok') => { setAviso({ texto, tipo }); setTimeout(() => setAviso(null), 3000) }
  const p = { ir, avisar }

  return (
    <Layout pantalla={pantalla} ir={ir} aviso={aviso}>
      {pantalla === 'panel' && <Panel {...p} />}
      {pantalla === 'lista' && <ListaVehiculos {...p} />}
      {pantalla === 'nuevo' && <FormVehiculo {...p} />}
      {pantalla === 'editar' && <FormVehiculo {...p} id={id} />}
      {pantalla === 'detalle' && <DetalleVehiculo {...p} id={id} />}
      {pantalla === 'mecanicos' && <Mecanicos {...p} />}
    </Layout>
  )
}
