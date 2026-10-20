import { useEffect, useState } from 'react'
import { leerSesion } from './api'
import Login from './components/Login'
import Layout from './components/Layout'
import Panel from './components/Panel'
import ListaVehiculos from './components/ListaVehiculos'
import FormVehiculo from './components/FormVehiculo'
import DetalleVehiculo from './components/DetalleVehiculo'
import Mecanicos from './components/Mecanicos'

// Sin librería de rutas: "pantalla" dice qué se muestra y "id" a qué vehículo se refiere.
export default function App() {
  const [logueado, setLogueado] = useState(!!leerSesion())
  const [pantalla, setPantalla] = useState('panel')   // panel | lista | nuevo | editar | detalle | mecanicos
  const [id, setId] = useState(null)
  const [aviso, setAviso] = useState(null)            // mensaje flotante { texto, tipo }

  // El botón «atrás» del celular o del navegador vuelve a la pantalla anterior
  useEffect(() => {
    const volver = (e) => { setPantalla(e.state?.pantalla ?? 'panel'); setId(e.state?.id ?? null) }
    window.addEventListener('popstate', volver)
    return () => window.removeEventListener('popstate', volver)
  }, [])

  if (!logueado) return <Login alEntrar={() => setLogueado(true)} />

  const ir = (nueva, idVehiculo = null) => {
    history.pushState({ pantalla: nueva, id: idVehiculo }, '')
    setPantalla(nueva); setId(idVehiculo)
    window.scrollTo({ top: 0 })
  }
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
