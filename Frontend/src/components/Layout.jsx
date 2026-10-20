import { useState } from 'react'
import { borrarSesion, leerSesion } from '../api'

const MENU = [
  { clave: 'panel', texto: '📊 Panel' },
  { clave: 'lista', texto: '🚗 Vehículos' },
  { clave: 'mecanicos', texto: '🧰 Mecánicos' },
]

// LAYOUT: la barra de arriba se repite en todas las pantallas; el contenido va en "children"
export default function Layout({ children, pantalla, ir, aviso }) {
  const [oscuro, setOscuro] = useState(localStorage.getItem('tema') === 'oscuro')

  // Bootstrap 5.3 cambia todos sus colores con este atributo
  document.documentElement.dataset.bsTheme = oscuro ? 'dark' : 'light'
  function cambiarTema() {
    localStorage.setItem('tema', oscuro ? 'claro' : 'oscuro')
    setOscuro(!oscuro)
  }

  function salir() { borrarSesion(); location.reload() }

  // "nuevo", "editar" y "detalle" pertenecen a la sección Vehículos
  const seccion = ['nuevo', 'editar', 'detalle'].includes(pantalla) ? 'lista' : pantalla

  return (
    <>
      <nav className="barra mb-4">
        <div className="container d-flex align-items-center gap-3 flex-wrap py-2">
          <span className="marca">🔧 {leerSesion()?.taller}</span>
          <div className="menu flex-grow-1">
            {MENU.map((m) => (
              <button key={m.clave} className={seccion === m.clave ? 'activo' : ''} onClick={() => ir(m.clave)}>{m.texto}</button>
            ))}
          </div>
          <button className="btn btn-sm btn-outline-light" onClick={cambiarTema} title="Cambiar tema">{oscuro ? '☀️' : '🌙'}</button>
          <button className="btn btn-sm btn-outline-light" onClick={salir}>Salir</button>
        </div>
      </nav>

      <div className="container pb-5 aparecer" key={pantalla}>{children}</div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.tipo === 'ok' ? '✅' : '⚠️'} {aviso.texto}</div>}
    </>
  )
}
